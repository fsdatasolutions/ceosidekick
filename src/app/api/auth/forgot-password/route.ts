import { NextResponse } from "next/server";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { sendPasswordResetEmail } from "@/lib/email";

// Lazy import database (matches signup route pattern)
async function getDb() {
    if (!process.env.DATABASE_URL) {
        return null;
    }
    const { db } = await import("@/db");
    return db;
}

async function getSchema() {
    const { users, passwordResetTokens } = await import("@/db/schema");
    return { users, passwordResetTokens };
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { error: "Email is required" },
                { status: 400 }
            );
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Generic success message (used everywhere to prevent email enumeration)
        const successResponse = {
            message: "If an account exists with that email, you will receive a password reset link.",
        };

        const db = await getDb();
        if (!db) {
            // Demo mode — just return success
            return NextResponse.json(successResponse);
        }

        const { users, passwordResetTokens } = await getSchema();

        // Look up user
        const [user] = await db
            .select({ id: users.id, email: users.email, password: users.password })
            .from(users)
            .where(eq(users.email, normalizedEmail))
            .limit(1);

        // User doesn't exist OR is OAuth-only (no password to reset)
        if (!user || !user.password) {
            return NextResponse.json(successResponse);
        }

        // Generate cryptographically secure token
        const token = crypto.randomBytes(32).toString("hex");
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Store token
        await db.insert(passwordResetTokens).values({
            userId: user.id,
            token,
            expiresAt,
        });

        // Send email
        await sendPasswordResetEmail(user.email, token);

        return NextResponse.json(successResponse);
    } catch (error) {
        console.error("[Forgot Password] Error:", error);
        return NextResponse.json(
            { error: "An error occurred. Please try again." },
            { status: 500 }
        );
    }
}
