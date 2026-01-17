// src/app/api/stripe/webhook/route.ts
// Handle Stripe webhook events

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import Stripe from "stripe";
import type { TierType } from "@/lib/tiers";

// Disable body parsing - we need the raw body for signature verification
export const runtime = "nodejs";

// Helper to safely extract subscription period dates
function getSubscriptionPeriod(subscription: Stripe.Subscription): {
  start: Date | undefined;
  end: Date | undefined;
} {
  // Use type assertion to access properties that exist at runtime
  // but may not be in TypeScript definitions for all API versions
  const raw = subscription as unknown as Record<string, unknown>;

  const startTimestamp = raw["current_period_start"] as number | undefined;
  const endTimestamp = raw["current_period_end"] as number | undefined;

  return {
    start: startTimestamp ? new Date(startTimestamp * 1000) : undefined,
    end: endTimestamp ? new Date(endTimestamp * 1000) : undefined,
  };
}

// Helper to safely extract subscription ID from invoice
function getSubscriptionIdFromInvoice(invoice: Stripe.Invoice): string | undefined {
  const raw = invoice as unknown as Record<string, unknown>;
  const sub = raw["subscription"];

  if (typeof sub === "string") return sub;
  if (sub && typeof sub === "object" && "id" in sub) {
    return (sub as { id: string }).id;
  }
  return undefined;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    console.error("[Stripe Webhook] Missing signature");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Stripe Webhook] Missing webhook secret");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("[Stripe Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("[Stripe Webhook] Received event:", event.type);

  try {
    switch (event.type) {
        // ============================================
        // SUBSCRIPTION EVENTS
        // ============================================

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        // Handle message pack purchase
        if (session.metadata?.type === "message_pack") {
          await handleMessagePackPurchase(session);
        }
        // Subscription handled by customer.subscription.created
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        // Renewal successful - subscription continues
        console.log("[Stripe Webhook] Invoice paid:", invoice.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log("[Stripe Webhook] Unhandled event type:", event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing event:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

// ============================================
// EVENT HANDLERS
// ============================================

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const tierId = subscription.metadata?.tierId;

  if (!userId) {
    console.error("[Webhook] Missing userId in subscription metadata");
    return;
  }

  console.log("[Webhook] Subscription change for user:", userId, "tier:", tierId);

  const { upgradeTier, createOrUpdateSubscription } = await import("@/lib/usage");

  // Get period dates safely
  const period = getSubscriptionPeriod(subscription);

  // Update subscription in database
  await createOrUpdateSubscription(userId, {
    tier: (tierId as TierType) || "free",
    status: subscription.status === "active" ? "active" : subscription.status,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0]?.price.id,
    currentPeriodStart: period.start,
    currentPeriodEnd: period.end,
  });

  // If upgrading, also update the current month's limit
  if (tierId && subscription.status === "active") {
    await upgradeTier(userId, tierId as TierType);
  }

  console.log("[Webhook] Subscription updated successfully");
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    console.error("[Webhook] Missing userId in subscription metadata");
    return;
  }

  console.log("[Webhook] Subscription canceled for user:", userId);

  const { createOrUpdateSubscription } = await import("@/lib/usage");

  // Get period end safely
  const period = getSubscriptionPeriod(subscription);

  // Downgrade to free tier
  await createOrUpdateSubscription(userId, {
    tier: "free",
    status: "canceled",
    stripeSubscriptionId: undefined,
    stripePriceId: undefined,
    currentPeriodEnd: period.end,
  });

  console.log("[Webhook] User downgraded to free tier");
}

async function handleMessagePackPurchase(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const packId = session.metadata?.packId;
  const messages = parseInt(session.metadata?.messages || "0");

  if (!userId || !packId || !messages) {
    console.error("[Webhook] Missing metadata in pack purchase session");
    return;
  }

  console.log("[Webhook] Message pack purchase:", packId, "for user:", userId);

  const { db } = await import("@/db");
  const { messagePurchases } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const { addBonusMessages } = await import("@/lib/usage");

  // Update purchase record to completed
  await db
      .update(messagePurchases)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(messagePurchases.stripeSessionId, session.id));

  // Add bonus messages to user's current period
  await addBonusMessages(userId, messages);

  console.log("[Webhook] Added", messages, "bonus messages for user:", userId);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Get subscription ID safely
  const subscriptionId = getSubscriptionIdFromInvoice(invoice);

  if (!subscriptionId) return;

  console.log("[Webhook] Payment failed for subscription:", subscriptionId);

  // Get subscription to find user
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;

  if (!userId) return;

  const { createOrUpdateSubscription } = await import("@/lib/usage");

  // Mark subscription as past_due
  await createOrUpdateSubscription(userId, {
    status: "past_due",
  });

  console.log("[Webhook] Marked subscription as past_due for user:", userId);
}