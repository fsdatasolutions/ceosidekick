import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Lazy load database
async function getDb() {
    if (!process.env.DATABASE_URL) {
        return null;
    }
    const { db } = await import("@/db");
    return db;
}

async function getSchema() {
    const { conversations, messages, documents } = await import("@/db/schema");
    return { conversations, messages, documents };
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
            // Return default values when database not configured
            return NextResponse.json({
                usage: {
                    messagesThisMonth: 0,
                    messageLimit: 500,
                    conversationCount: 0,
                    documentCount: 0,
                    plan: "free",
                },
            });
        }

        const { conversations, messages, documents } = await getSchema();
        const { eq, and, gte, count } = await import("drizzle-orm");

        // Get start of current month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Fetch all usage data in parallel
        const [messagesResult, conversationResult, documentResult] = await Promise.all([
            // Count user messages this month
            db
                .select({ count: count() })
                .from(messages)
                .innerJoin(conversations, eq(messages.conversationId, conversations.id))
                .where(
                    and(
                        eq(conversations.userId, userId),
                        eq(messages.role, "user"),
                        gte(messages.createdAt, startOfMonth)
                    )
                ),

            // Count active conversations
            db
                .select({ count: count() })
                .from(conversations)
                .where(
                    and(
                        eq(conversations.userId, userId),
                        eq(conversations.isArchived, false)
                    )
                ),

            // Count documents
            db
                .select({ count: count() })
                .from(documents)
                .where(eq(documents.userId, userId)),
        ]);

        // TODO: Get actual plan from user's organization/subscription
        const plan: string = "starter"; // Default to starter for now
        const messageLimit = plan === "free" ? 50 : plan === "starter" ? 500 : plan === "professional" ? 2000 : 10000;

        return NextResponse.json({
            usage: {
                messagesThisMonth: messagesResult[0]?.count || 0,
                messageLimit,
                conversationCount: conversationResult[0]?.count || 0,
                documentCount: documentResult[0]?.count || 0,
                plan,
            },
        });
    } catch (error) {
        console.error("[Usage API] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch usage" },
            { status: 500 }
        );
    }
}