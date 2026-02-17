import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserUsage } from "@/lib/usage";
import { getTier } from "@/lib/tiers";

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
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const db = await getDb();

        if (!db) {
            return NextResponse.json({
                usage: {
                    creditsThisMonth: 0,
                    creditLimit: 30,
                    conversationCount: 0,
                    documentCount: 0,
                    plan: "free",
                    tier: "free",
                    tierName: "Free",
                    tierPrice: "$0",
                    companyLibraryStorageMB: 0,
                    creditsUsed: 0,
                    creditsLimit: 30,
                    bonusCredits: 0,
                    totalAvailable: 30,
                    remaining: 30,
                    percentage: 0,
                    period: "",
                    status: "ok",
                    canUseCredits: true,
                },
            });
        }

        const usage = await getUserUsage(userId);
        const tier = getTier(usage.tier);

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
                ...usage,
                creditsThisMonth: usage.creditsUsed,
                creditLimit: usage.creditsLimit,
                plan: usage.tier,
                conversationCount: conversationResult[0]?.count || 0,
                documentCount: documentResult[0]?.count || 0,
                tierPrice: tier.priceDisplay,
                companyLibraryStorageMB: tier.companyLibraryStorageMB,
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
