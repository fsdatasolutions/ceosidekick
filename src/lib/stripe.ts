// src/lib/stripe.ts
// Stripe configuration and helper functions

import Stripe from "stripe";

// Initialize Stripe with API key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-12-15.clover",
  typescript: true,
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