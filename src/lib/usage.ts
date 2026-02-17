// src/lib/usage.ts
// Usage tracking utilities for credit limits

import { db } from "@/db";
import { eq, and, sql } from "drizzle-orm";
import { subscriptions, monthlyUsage } from "@/db/schema";
import { getTier, TierType, getUsageStatus, getUsagePercentage } from "./tiers";

// ===========================================
// TYPES
// ===========================================

export interface UsageInfo {
    tier: TierType;
    tierName: string;
    period: string;
    creditsUsed: number;
    creditsLimit: number;
    bonusCredits: number;
    totalAvailable: number;
    remaining: number;
    percentage: number;
    status: "ok" | "warning" | "critical" | "exceeded";
    canUseCredits: boolean;
}

export interface UsageCheckResult {
    allowed: boolean;
    reason?: string;
    usage: UsageInfo;
}

// ===========================================
// HELPERS
// ===========================================

export function getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
}

// ===========================================
// GET USER SUBSCRIPTION
// ===========================================

export async function getUserSubscription(userId: string) {
    const sub = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1);

    return sub[0] || null;
}

// ===========================================
// GET OR CREATE MONTHLY USAGE
// ===========================================

export async function getOrCreateMonthlyUsage(userId: string): Promise<typeof monthlyUsage.$inferSelect> {
    const period = getCurrentPeriod();

    // Get user's subscription to determine limit
    const subscription = await getUserSubscription(userId);
    const tier = getTier(subscription?.tier || "free");
    const currentTierLimit = tier.creditsPerMonth;

    // Try to get existing record
    const existing = await db
        .select()
        .from(monthlyUsage)
        .where(and(
            eq(monthlyUsage.userId, userId),
            eq(monthlyUsage.period, period)
        ))
        .limit(1);

    if (existing[0]) {
        // Sync the limit if tier has changed (e.g., user upgraded)
        if (existing[0].creditsLimit !== currentTierLimit) {
            console.log(`[Usage] Syncing credit limit: ${existing[0].creditsLimit} -> ${currentTierLimit} for user ${userId}`);
            const [updated] = await db
                .update(monthlyUsage)
                .set({
                    creditsLimit: currentTierLimit,
                    updatedAt: new Date(),
                })
                .where(and(
                    eq(monthlyUsage.userId, userId),
                    eq(monthlyUsage.period, period)
                ))
                .returning();
            return updated;
        }
        return existing[0];
    }

    // Create new monthly usage record
    const [newUsage] = await db
        .insert(monthlyUsage)
        .values({
            userId,
            period,
            creditsUsed: 0,
            creditsLimit: currentTierLimit,
            bonusCredits: 0,
        })
        .returning();

    return newUsage;
}

// ===========================================
// GET USER USAGE INFO
// ===========================================

export async function getUserUsage(userId: string): Promise<UsageInfo> {
    const subscription = await getUserSubscription(userId);
    const tierType = (subscription?.tier || "free") as TierType;
    const tier = getTier(tierType);

    const usage = await getOrCreateMonthlyUsage(userId);

    const totalAvailable = usage.creditsLimit + usage.bonusCredits;
    const remaining = Math.max(0, totalAvailable - usage.creditsUsed);
    const percentage = getUsagePercentage(usage.creditsUsed, totalAvailable);
    const status = getUsageStatus(usage.creditsUsed, totalAvailable);

    return {
        tier: tierType,
        tierName: tier.name,
        period: usage.period,
        creditsUsed: usage.creditsUsed,
        creditsLimit: usage.creditsLimit,
        bonusCredits: usage.bonusCredits,
        totalAvailable,
        remaining,
        percentage,
        status,
        canUseCredits: remaining > 0,
    };
}

// ===========================================
// CHECK IF USER CAN USE CREDITS
// ===========================================

export async function checkCreditAllowance(userId: string, creditCost: number = 1): Promise<UsageCheckResult> {
    const usage = await getUserUsage(userId);

    // Check if user has enough credits for this cost
    if (usage.remaining < creditCost) {
        return {
            allowed: false,
            reason: creditCost > 1
                ? `This action costs ${creditCost} credits. You have ${usage.remaining} remaining. Upgrade your plan or purchase a credit pack to continue.`
                : "You've reached your monthly credit limit. Upgrade your plan or purchase a credit pack to continue.",
            usage,
        };
    }

    return {
        allowed: true,
        usage,
    };
}

// ===========================================
// INCREMENT CREDIT USAGE
// ===========================================

export async function incrementCreditUsage(userId: string, amount: number = 1): Promise<UsageInfo> {
    const period = getCurrentPeriod();

    // Ensure usage record exists
    await getOrCreateMonthlyUsage(userId);

    // Increment the counter by the specified amount
    await db
        .update(monthlyUsage)
        .set({
            creditsUsed: sql`${monthlyUsage.creditsUsed} + ${amount}`,
            updatedAt: new Date(),
        })
        .where(and(
            eq(monthlyUsage.userId, userId),
            eq(monthlyUsage.period, period)
        ));

    // Return updated usage
    return getUserUsage(userId);
}

// ===========================================
// ADD BONUS CREDITS (from pack purchases)
// ===========================================

export async function addBonusCredits(userId: string, amount: number): Promise<UsageInfo> {
    const period = getCurrentPeriod();

    // Ensure usage record exists
    await getOrCreateMonthlyUsage(userId);

    // Add bonus credits
    await db
        .update(monthlyUsage)
        .set({
            bonusCredits: sql`${monthlyUsage.bonusCredits} + ${amount}`,
            updatedAt: new Date(),
        })
        .where(and(
            eq(monthlyUsage.userId, userId),
            eq(monthlyUsage.period, period)
        ));

    return getUserUsage(userId);
}

// ===========================================
// CREATE OR UPDATE SUBSCRIPTION
// ===========================================

export async function createOrUpdateSubscription(
    userId: string,
    data: {
        tier?: TierType;
        status?: string;
        stripeCustomerId?: string;
        stripeSubscriptionId?: string;
        stripePriceId?: string;
        currentPeriodStart?: Date;
        currentPeriodEnd?: Date;
    }
) {
    const existing = await getUserSubscription(userId);

    if (existing) {
        const [updated] = await db
            .update(subscriptions)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(eq(subscriptions.userId, userId))
            .returning();

        return updated;
    }

    const [created] = await db
        .insert(subscriptions)
        .values({
            userId,
            tier: data.tier || "free",
            status: data.status || "active",
            stripeCustomerId: data.stripeCustomerId,
            stripeSubscriptionId: data.stripeSubscriptionId,
            stripePriceId: data.stripePriceId,
            currentPeriodStart: data.currentPeriodStart,
            currentPeriodEnd: data.currentPeriodEnd,
        })
        .returning();

    return created;
}

// ===========================================
// UPGRADE TIER (updates limit for current period)
// ===========================================

export async function upgradeTier(userId: string, newTier: TierType): Promise<void> {
    const tier = getTier(newTier);
    const period = getCurrentPeriod();

    // Update subscription
    await createOrUpdateSubscription(userId, { tier: newTier });

    // Update current period's limit (pro-rated upgrade benefit)
    await db
        .update(monthlyUsage)
        .set({
            creditsLimit: tier.creditsPerMonth,
            updatedAt: new Date(),
        })
        .where(and(
            eq(monthlyUsage.userId, userId),
            eq(monthlyUsage.period, period)
        ));
}

// ===========================================
// GET USER TIER (for server-side layout usage)
// ===========================================

export async function getUserTier(userId: string): Promise<string> {
    const subscription = await getUserSubscription(userId);
    return subscription?.tier || "free";
}
