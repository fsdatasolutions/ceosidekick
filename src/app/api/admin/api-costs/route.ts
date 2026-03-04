// src/app/api/admin/api-costs/route.ts
// Admin API for monthly API cost tracking
// Uses usageLogs for granular token data, falls back to monthlyUsage credit data

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkAdminAccess } from "@/lib/admin";
import { db } from "@/db";
import { usageLogs, monthlyUsage } from "@/db/schema";
import { sql, desc, gte } from "drizzle-orm";
import { calculateApiCost, ANTHROPIC_PRICING } from "@/lib/api-pricing";
import { TOKENS_PER_CREDIT } from "@/lib/credits";

// Blended cost estimate per credit based on model mix
// Assumes ~70% chat (opus @ $15/$75) + 30% content (sonnet @ $3/$15)
// with roughly 40% input / 60% output split
const ESTIMATED_COST_PER_CREDIT = 0.116;

export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const { isAdmin } = await checkAdminAccess(session.user.id);
        if (!isAdmin) {
            return NextResponse.json(
                { error: "Admin access required" },
                { status: 403 }
            );
        }

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        // ---- 1. Query usageLogs for granular token-level data ----
        const rawData = await db
            .select({
                month: sql<string>`TO_CHAR(${usageLogs.createdAt}, 'YYYY-MM')`,
                model: usageLogs.model,
                type: usageLogs.type,
                totalInputTokens: sql<number>`COALESCE(SUM(${usageLogs.inputTokens}), 0)::int`,
                totalOutputTokens: sql<number>`COALESCE(SUM(${usageLogs.outputTokens}), 0)::int`,
                requestCount: sql<number>`COUNT(*)::int`,
            })
            .from(usageLogs)
            .where(gte(usageLogs.createdAt, sixMonthsAgo))
            .groupBy(
                sql`TO_CHAR(${usageLogs.createdAt}, 'YYYY-MM')`,
                usageLogs.model,
                usageLogs.type
            )
            .orderBy(desc(sql`TO_CHAR(${usageLogs.createdAt}, 'YYYY-MM')`));

        // ---- 2. Query monthlyUsage for credit-based data (always populated) ----
        const sixMonthsAgoFormatted = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, "0")}`;

        const creditData = await db
            .select({
                period: monthlyUsage.period,
                totalCreditsUsed: sql<number>`COALESCE(SUM(${monthlyUsage.creditsUsed}), 0)::int`,
                activeUsers: sql<number>`COUNT(CASE WHEN ${monthlyUsage.creditsUsed} > 0 THEN 1 END)::int`,
                totalUsers: sql<number>`COUNT(*)::int`,
            })
            .from(monthlyUsage)
            .where(gte(monthlyUsage.period, sixMonthsAgoFormatted))
            .groupBy(monthlyUsage.period)
            .orderBy(desc(monthlyUsage.period));

        // ---- 3. Build per-month token-level data from usageLogs ----
        const tokenMonthMap = new Map<string, {
            month: string;
            totalInputTokens: number;
            totalOutputTokens: number;
            totalRequests: number;
            estimatedCost: number;
            byModel: Map<string, { model: string; inputTokens: number; outputTokens: number; requests: number; estimatedCost: number }>;
            byType: Map<string, { type: string; inputTokens: number; outputTokens: number; requests: number; estimatedCost: number }>;
        }>();

        for (const row of rawData) {
            const monthKey = row.month;
            if (!tokenMonthMap.has(monthKey)) {
                tokenMonthMap.set(monthKey, {
                    month: monthKey,
                    totalInputTokens: 0,
                    totalOutputTokens: 0,
                    totalRequests: 0,
                    estimatedCost: 0,
                    byModel: new Map(),
                    byType: new Map(),
                });
            }

            const monthData = tokenMonthMap.get(monthKey)!;
            const rowCost = calculateApiCost(row.model, row.totalInputTokens, row.totalOutputTokens);

            monthData.totalInputTokens += row.totalInputTokens;
            monthData.totalOutputTokens += row.totalOutputTokens;
            monthData.totalRequests += row.requestCount;
            monthData.estimatedCost += rowCost;

            // By model
            const modelKey = row.model || "unknown";
            if (!monthData.byModel.has(modelKey)) {
                monthData.byModel.set(modelKey, { model: modelKey, inputTokens: 0, outputTokens: 0, requests: 0, estimatedCost: 0 });
            }
            const modelData = monthData.byModel.get(modelKey)!;
            modelData.inputTokens += row.totalInputTokens;
            modelData.outputTokens += row.totalOutputTokens;
            modelData.requests += row.requestCount;
            modelData.estimatedCost += rowCost;

            // By type
            const typeKey = row.type || "unknown";
            if (!monthData.byType.has(typeKey)) {
                monthData.byType.set(typeKey, { type: typeKey, inputTokens: 0, outputTokens: 0, requests: 0, estimatedCost: 0 });
            }
            const typeData = monthData.byType.get(typeKey)!;
            typeData.inputTokens += row.totalInputTokens;
            typeData.outputTokens += row.totalOutputTokens;
            typeData.requests += row.requestCount;
            typeData.estimatedCost += rowCost;
        }

        // Convert token-level months to array
        const months = Array.from(tokenMonthMap.values()).map((m) => ({
            month: m.month,
            totalInputTokens: m.totalInputTokens,
            totalOutputTokens: m.totalOutputTokens,
            totalRequests: m.totalRequests,
            estimatedCost: Math.round(m.estimatedCost * 100) / 100,
            byModel: Array.from(m.byModel.values()).map((v) => ({
                ...v,
                estimatedCost: Math.round(v.estimatedCost * 100) / 100,
            })),
            byType: Array.from(m.byType.values()).map((v) => ({
                ...v,
                estimatedCost: Math.round(v.estimatedCost * 100) / 100,
            })),
        }));

        // ---- 4. Build credit-based usage summary ----
        const creditUsage = creditData.map((row) => ({
            month: row.period,
            totalCreditsUsed: row.totalCreditsUsed,
            activeUsers: row.activeUsers,
            totalUsers: row.totalUsers,
            estimatedTokens: row.totalCreditsUsed * TOKENS_PER_CREDIT,
            estimatedCost: Math.round(row.totalCreditsUsed * ESTIMATED_COST_PER_CREDIT * 100) / 100,
        }));

        return NextResponse.json({
            months,        // Granular token data from usageLogs (grows over time)
            creditUsage,   // Credit-based data from monthlyUsage (always available)
            pricing: ANTHROPIC_PRICING,
            tokensPerCredit: TOKENS_PER_CREDIT,
        });
    } catch (error) {
        console.error("[Admin API Costs] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch API costs" },
            { status: 500 }
        );
    }
}
