import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// Lazy database imports
async function getDb() {
    if (!process.env.DATABASE_URL) return null;
    const { db } = await import("@/db");
    return db;
}

async function getSchema() {
    const { userSettings, users } = await import("@/db/schema");
    return { userSettings, users };
}

// Whitelist of fields that can be saved during onboarding
const ALLOWED_FIELDS = [
    "companyName",
    "industry",
    "companySize",
    "productsServices",
    "targetMarket",
    "userRole",
    "yearsExperience",
    "areasOfFocus",
    "currentChallenges",
    "shortTermGoals",
    "communicationStyle",
    "responseLength",
];

// POST - Save onboarding step data
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data, complete } = await request.json();

        const db = await getDb();
        if (!db) {
            return NextResponse.json(
                { error: "Database not configured" },
                { status: 500 }
            );
        }

        const { userSettings, users } = await getSchema();

        // Sanitize: only allow whitelisted fields
        const sanitizedData: Record<string, string | null> = {};
        for (const [key, value] of Object.entries(data || {})) {
            if (ALLOWED_FIELDS.includes(key)) {
                sanitizedData[key] = (value as string) || null;
            }
        }

        // Upsert user settings (only if there's data to save)
        if (Object.keys(sanitizedData).length > 0) {
            const existing = await db
                .select()
                .from(userSettings)
                .where(eq(userSettings.userId, session.user.id))
                .limit(1);

            if (existing.length > 0) {
                await db
                    .update(userSettings)
                    .set({ ...sanitizedData, updatedAt: new Date() })
                    .where(eq(userSettings.userId, session.user.id));
            } else {
                await db.insert(userSettings).values({
                    userId: session.user.id,
                    ...sanitizedData,
                });
            }
        }

        // Mark onboarding as complete if requested
        if (complete) {
            await db
                .update(users)
                .set({ onboardingCompleted: true, updatedAt: new Date() })
                .where(eq(users.id, session.user.id));
        }

        const response = NextResponse.json({ success: true });

        // When completing onboarding, set a short-lived cookie so the middleware
        // knows onboarding was just finished, even before the JWT is refreshed.
        // This prevents the redirect loop where the stale JWT still has
        // onboardingCompleted=false.
        if (complete) {
            response.cookies.set("onboarding_done", "1", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60, // 60 seconds — just long enough for the redirect
            });
        }

        return response;
    } catch (error) {
        console.error("[Onboarding] POST error:", error);
        return NextResponse.json(
            { error: "Failed to save onboarding data" },
            { status: 500 }
        );
    }
}
