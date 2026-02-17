// src/lib/services/usage.ts
// Usage tracking and credit deduction service

import { db } from "@/db";
import { monthlyUsage, usageLogs } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Get current billing period in YYYY-MM format
 */
export function getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Check if user has at least 1 credit available
 */
export async function checkCredits(userId: string): Promise<boolean> {
    return checkCreditsAmount(userId, 1);
}

/**
 * Check if user has a specific amount of credits available
 */
export async function checkCreditsAmount(
    userId: string,
    amount: number
): Promise<boolean> {
    const period = getCurrentPeriod();

    const [usage] = await db
        .select()
        .from(monthlyUsage)
        .where(
            and(
                eq(monthlyUsage.userId, userId),
                eq(monthlyUsage.period, period)
            )
        )
        .limit(1);

    if (!usage) {
        // No usage record means user hasn't used anything yet this period
        // They should have credits if they have a subscription
        return true;
    }

    const totalAvailable = usage.creditsLimit + usage.bonusCredits;
    const remaining = totalAvailable - usage.creditsUsed;

    return remaining >= amount;
}

/**
 * Get remaining credits for a user
 */
export async function getRemainingCredits(userId: string): Promise<{
    used: number;
    limit: number;
    bonus: number;
    remaining: number;
}> {
    const period = getCurrentPeriod();

    const [usage] = await db
        .select()
        .from(monthlyUsage)
        .where(
            and(
                eq(monthlyUsage.userId, userId),
                eq(monthlyUsage.period, period)
            )
        )
        .limit(1);

    if (!usage) {
        return {
            used: 0,
            limit: 0,
            bonus: 0,
            remaining: 0,
        };
    }

    const totalAvailable = usage.creditsLimit + usage.bonusCredits;

    return {
        used: usage.creditsUsed,
        limit: usage.creditsLimit,
        bonus: usage.bonusCredits,
        remaining: totalAvailable - usage.creditsUsed,
    };
}

export interface UsageLogData {
    type: string;
    agent?: string;
    inputTokens?: number;
    outputTokens?: number;
    model?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Deduct a single credit
 */
export async function deductCredit(
    userId: string,
    logData?: UsageLogData
): Promise<void> {
    return deductCredits(userId, 1, logData);
}

/**
 * Deduct multiple credits
 */
export async function deductCredits(
    userId: string,
    amount: number,
    logData?: UsageLogData
): Promise<void> {
    const period = getCurrentPeriod();

    // Update monthly usage using sql template for increment
    await db
        .update(monthlyUsage)
        .set({
            creditsUsed: sql`${monthlyUsage.creditsUsed} + ${amount}`,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(monthlyUsage.userId, userId),
                eq(monthlyUsage.period, period)
            )
        );

    // Log usage if data provided
    if (logData) {
        await db.insert(usageLogs).values({
            userId,
            type: logData.type,
            agent: logData.agent,
            inputTokens: logData.inputTokens,
            outputTokens: logData.outputTokens,
            model: logData.model,
            metadata: {
                ...logData.metadata,
                creditsDeducted: amount,
            },
        });
    }
}

/**
 * Ensure user has a monthly usage record for the current period
 * Call this when a user starts a new billing cycle
 */
export async function ensureMonthlyUsageRecord(
    userId: string,
    creditsLimit: number
): Promise<void> {
    const period = getCurrentPeriod();

    // Check if record exists
    const [existing] = await db
        .select()
        .from(monthlyUsage)
        .where(
            and(
                eq(monthlyUsage.userId, userId),
                eq(monthlyUsage.period, period)
            )
        )
        .limit(1);

    if (!existing) {
        // Create new record for this period
        await db.insert(monthlyUsage).values({
            userId,
            period,
            creditsUsed: 0,
            creditsLimit,
            bonusCredits: 0,
        });
    }
}
