// src/lib/stripe.ts
// Stripe configuration and helper functions

import Stripe from "stripe";

// Lazy-initialize Stripe so the module can be imported at build time
// without crashing when STRIPE_SECRET_KEY is not yet available.
let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (_stripe) return _stripe;
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY environment variable is not set");
  }
  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-12-15.clover",
    typescript: true,
  });
  return _stripe;
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    const realStripe = getStripe();
    const value = Reflect.get(realStripe, prop, receiver);
    return typeof value === "function" ? value.bind(realStripe) : value;
  },
});

// Helper to get or create a Stripe customer for a user
export async function getOrCreateStripeCustomer(
    userId: string,
    email: string,
    name?: string | null
): Promise<string> {
  const { db } = await import("@/db");
  const { subscriptions } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  // Check if user already has a Stripe customer ID
  const existingSub = await db
      .select({ stripeCustomerId: subscriptions.stripeCustomerId })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1);

  if (existingSub[0]?.stripeCustomerId) {
    return existingSub[0].stripeCustomerId;
  }

  // Create a new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId,
    },
  });

  // Save the customer ID to the subscription record
  const { createOrUpdateSubscription } = await import("@/lib/usage");
  await createOrUpdateSubscription(userId, {
    stripeCustomerId: customer.id,
  });

  return customer.id;
}

// Helper to format price for display
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}