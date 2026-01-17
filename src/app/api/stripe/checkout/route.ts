// src/app/api/stripe/checkout/route.ts
// Create Stripe checkout session for subscription upgrades

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe, getOrCreateStripeCustomer } from "@/lib/stripe";
import { TIERS, TierType } from "@/lib/tiers";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tierId } = body as { tierId: TierType };

    // Validate tier
    const tier = TIERS[tierId];
    if (!tier) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    if (tier.isComingSoon) {
      return NextResponse.json({ error: "This tier is not yet available" }, { status: 400 });
    }

    if (tierId === "free") {
      return NextResponse.json({ error: "Cannot checkout for free tier" }, { status: 400 });
    }

    // Get Stripe price ID from environment
    const priceIdKey = `STRIPE_PRICE_${tierId.toUpperCase()}`;
    const stripePriceId = process.env[priceIdKey];

    if (!stripePriceId) {
      console.error(`Missing Stripe price ID for tier: ${tierId}. Set ${priceIdKey} in environment.`);
      return NextResponse.json(
        { error: "Payment not configured for this tier" },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      session.user.id,
      session.user.email,
      session.user.name
    );

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL || process.env.AUTH_URL}/dashboard?upgrade=success&tier=${tierId}`,
      cancel_url: `${process.env.NEXTAUTH_URL || process.env.AUTH_URL}/pricing?upgrade=cancelled`,
      metadata: {
        userId: session.user.id,
        tierId,
      },
      subscription_data: {
        metadata: {
          userId: session.user.id,
          tierId,
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[Stripe Checkout] Error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
