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

        const response = NextResponse.json({ success: true });

        // Set a short-lived cookie so the middleware knows onboarding was just
        // completed, even before the JWT cookie is refreshed. This prevents the
        // redirect loop where the stale JWT still has onboardingCompleted=false.
        response.cookies.set("onboarding_done", "1", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60, // 60 seconds — just long enough for the redirect
        });

        return response;
    } catch (error) {
        console.error("[Onboarding] Skip error:", error);
        return NextResponse.json(
            { error: "Failed to skip onboarding" },
            { status: 500 }
        );
    }
}
