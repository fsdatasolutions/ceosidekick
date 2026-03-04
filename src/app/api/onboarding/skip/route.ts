import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// Lazy database imports
async function getDb() {
    if (!process.env.DATABASE_URL) return null;
    const { db } = await import("@/db");
    return db;
}

async function getSchema() {
    const { users } = await import("@/db/schema");
    return { users };
}

// POST - Skip onboarding (marks as completed without saving settings)
export async function POST() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = await getDb();
        if (!db) {
            return NextResponse.json(
                { error: "Database not configured" },
                { status: 500 }
            );
        }

        const { users } = await getSchema();

        await db
            .update(users)
            .set({ onboardingCompleted: true, updatedAt: new Date() })
            .where(eq(users.id, session.user.id));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[Onboarding] Skip error:", error);
        return NextResponse.json(
            { error: "Failed to skip onboarding" },
            { status: 500 }
        );
    }
}
