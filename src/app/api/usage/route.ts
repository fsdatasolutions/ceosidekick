// src/app/api/usage/route.ts
// API endpoint to get current user's usage information
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserUsage } from "@/lib/usage";
import { getTier } from "@/lib/tiers";

// Lazy load for conversation/document counts
async function getDb() {
    if (!process.env.DATABASE_URL) {
        return null;
    }
    const { db } = await import("@/db");
    return db;
}

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = session.user.id;
        const db = await getDb();

        if (!db) {
            // Fallback when database not configured
            return NextResponse.json({
                usage: {
                    // Legacy fields (backward compat)
                    messagesThisMonth: 0,
                    messageLimit: 50,
                    conversationCount: 0,
                    documentCount: 0,
                    plan: "free",
                    // New fields
                    tier: "free",
                    tierName: "Free",
                    tierPrice: "$0",
                    documentStorageMB: 10,
                    messagesUsed: 0,
                    messagesLimit: 50,
                    bonusMessages: 0,
                    totalAvailable: 50,
                    remaining: 50,
                    percentage: 0,
                    period: "",
                    status: "ok",
                    canSendMessage: true,
                },
            });
        }

        const usage = await getUserUsage(userId);
        const tier = getTier(usage.tier);

        // Get conversation and document counts (legacy fields)
        const { conversations, documents } = await import("@/db/schema");
        const { eq, and, count } = await import("drizzle-orm");

        const [conversationResult, documentResult] = await Promise.all([
            db
                .select({ count: count() })
                .from(conversations)
                .where(
                    and(
                        eq(conversations.userId, userId),
                        eq(conversations.isArchived, false)
                    )
                ),
            db
                .select({ count: count() })
                .from(documents)
                .where(eq(documents.userId, userId)),
        ]);

        return NextResponse.json({
            usage: {
                // Spread all new usage fields from getUserUsage
                ...usage,
                // Legacy field aliases (backward compat for frontend)
                messagesThisMonth: usage.messagesUsed,
                messageLimit: usage.messagesLimit,
                plan: usage.tier,
                // Conversation and document counts (not in getUserUsage)
                conversationCount: conversationResult[0]?.count || 0,
                documentCount: documentResult[0]?.count || 0,
                // Enriched tier info
                tierPrice: tier.priceDisplay,
                documentStorageMB: tier.documentStorageMB,
            },
        });
    } catch (error) {
        console.error("[Usage API] Error:", error);
        return NextResponse.json(
            { error: "Failed to get usage information" },
            { status: 500 }
        );
    }
}