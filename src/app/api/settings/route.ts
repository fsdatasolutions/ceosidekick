import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// Settings type for validation
export interface UserSettings {
    // Company Profile
    companyName?: string;
    industry?: string;
    companySize?: string;
    annualRevenue?: string;
    productsServices?: string;
    targetMarket?: string;

    // User Profile
    userRole?: string;
    yearsExperience?: string;
    areasOfFocus?: string;

    // Business Context
    currentChallenges?: string;
    shortTermGoals?: string;
    longTermGoals?: string;
    techStack?: string;
    teamStructure?: string;

    // Preferences
    communicationStyle?: string;
    responseLength?: string;
}

// Lazy database imports
async function getDb() {
    if (!process.env.DATABASE_URL) return null;
    const { db } = await import("@/db");
    return db;
}

async function getSchema() {
    const { userSettings } = await import("@/db/schema");
    return { userSettings };
}

// In-memory fallback for demo mode
const inMemorySettings: Record<string, UserSettings> = {};

// GET - Fetch user settings
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = await getDb();

        if (db) {
            const { userSettings } = await getSchema();
            const results = await db
                .select()
                .from(userSettings)
                .where(eq(userSettings.userId, session.user.id))
                .limit(1);

            if (results.length === 0) {
                return NextResponse.json({ settings: {} });
            }

            // Return only the settings fields (exclude id, userId, timestamps)
            const s = results[0];
            return NextResponse.json({
                settings: {
                    companyName: s.companyName,
                    industry: s.industry,
                    companySize: s.companySize,
                    annualRevenue: s.annualRevenue,
                    productsServices: s.productsServices,
                    targetMarket: s.targetMarket,
                    userRole: s.userRole,
                    yearsExperience: s.yearsExperience,
                    areasOfFocus: s.areasOfFocus,
                    currentChallenges: s.currentChallenges,
                    shortTermGoals: s.shortTermGoals,
                    longTermGoals: s.longTermGoals,
                    techStack: s.techStack,
                    teamStructure: s.teamStructure,
                    communicationStyle: s.communicationStyle,
                    responseLength: s.responseLength,
                }
            });
        }

        // Fallback to in-memory
        return NextResponse.json({
            settings: inMemorySettings[session.user.id] || {}
        });
    } catch (error) {
        console.error("Settings GET error:", error);
        return NextResponse.json(
            { error: "Failed to fetch settings" },
            { status: 500 }
        );
    }
}

// POST - Update user settings
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("[Settings POST] Saving for userId:", session.user.id);

        const body = await request.json();

        // Extract only the settings fields we want to save (exclude id, timestamps, etc.)
        const settingsToSave = {
            companyName: body.companyName || null,
            industry: body.industry || null,
            companySize: body.companySize || null,
            annualRevenue: body.annualRevenue || null,
            productsServices: body.productsServices || null,
            targetMarket: body.targetMarket || null,
            userRole: body.userRole || null,
            yearsExperience: body.yearsExperience || null,
            areasOfFocus: body.areasOfFocus || null,
            currentChallenges: body.currentChallenges || null,
            shortTermGoals: body.shortTermGoals || null,
            longTermGoals: body.longTermGoals || null,
            techStack: body.techStack || null,
            teamStructure: body.teamStructure || null,
            communicationStyle: body.communicationStyle || null,
            responseLength: body.responseLength || null,
        };

        const db = await getDb();

        if (db) {
            const { userSettings } = await getSchema();

            // Check if settings exist
            const existing = await db
                .select()
                .from(userSettings)
                .where(eq(userSettings.userId, session.user.id))
                .limit(1);

            console.log("[Settings POST] Existing settings:", existing.length > 0 ? "yes" : "no");

            if (existing.length > 0) {
                // Update existing - only update the specific fields
                await db
                    .update(userSettings)
                    .set({
                        ...settingsToSave,
                        updatedAt: new Date(),
                    })
                    .where(eq(userSettings.userId, session.user.id));
                console.log("[Settings POST] Updated existing settings");
            } else {
                // Create new
                await db.insert(userSettings).values({
                    userId: session.user.id,
                    ...settingsToSave,
                });
                console.log("[Settings POST] Created new settings");
            }

            // Fetch and return updated settings
            const updated = await db
                .select()
                .from(userSettings)
                .where(eq(userSettings.userId, session.user.id))
                .limit(1);

            console.log("[Settings POST] Saved successfully, company:", updated[0]?.companyName);

            return NextResponse.json({ settings: updated[0] });
        }

        // Fallback to in-memory
        inMemorySettings[session.user.id] = {
            ...inMemorySettings[session.user.id],
            ...settingsToSave,
        };

        return NextResponse.json({
            settings: inMemorySettings[session.user.id]
        });
    } catch (error) {
        console.error("Settings POST error:", error);
        return NextResponse.json(
            { error: "Failed to save settings" },
            { status: 500 }
        );
    }
}