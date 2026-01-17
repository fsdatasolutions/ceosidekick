// src/app/api/stripe/checkout-pack/route.ts
// Create Stripe checkout session for message pack purchases

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import { MESSAGE_PACKS, getMessagePack } from "@/lib/tiers";
import { getCurrentPeriod } from "@/lib/usage";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { packId } = body as { packId: string };

    // Validate pack
    const pack = getMessagePack(packId);
    if (!pack) {
      return NextResponse.json({ error: "Invalid message pack" }, { status: 400 });
    }

    // Get Stripe price ID from environment
    const priceIdKey = `STRIPE_PRICE_PACK_${packId.toUpperCase()}`;
    const stripePriceId = process.env[priceIdKey];

    if (!stripePriceId) {
      console.error(`Missing Stripe price ID for pack: ${packId}. Set ${priceIdKey} in environment.`);
      return NextResponse.json(
        { error: "Payment not configured for this pack" },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      session.user.id,
      session.user.email,
      session.user.name
    );

    const currentPeriod = getCurrentPeriod();

    // Create checkout session for one-time payment
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL || process.env.AUTH_URL}/dashboard?pack=success&messages=${pack.messages}`,
      cancel_url: `${process.env.NEXTAUTH_URL || process.env.AUTH_URL}/dashboard?pack=cancelled`,
      metadata: {
        userId: session.user.id,
        packId,
        messages: pack.messages.toString(),
        period: currentPeriod,
        type: "message_pack",
      },
    });

    // Create pending purchase record
    const { db } = await import("@/db");
    const { messagePurchases } = await import("@/db/schema");

    await db.insert(messagePurchases).values({
      userId: session.user.id,
      packId,
      messagesAmount: pack.messages,
      priceInCents: pack.price,
      stripeSessionId: checkoutSession.id,
      status: "pending",
      appliedToPeriod: currentPeriod,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[Stripe Pack Checkout] Error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
