import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq, and, isNull, gt } from "drizzle-orm";

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
        const { token, password } = body;

        if (!token || !password) {
            return NextResponse.json(
                { error: "Token and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        const db = await getDb();
        if (!db) {
            return NextResponse.json(
                { error: "Service unavailable" },
                { status: 503 }
            );
        }

        const { users, passwordResetTokens } = await getSchema();

        // Find valid token: not used and not expired
        const [resetToken] = await db
            .select()
            .from(passwordResetTokens)
            .where(
                and(
                    eq(passwordResetTokens.token, token),
                    isNull(passwordResetTokens.usedAt),
                    gt(passwordResetTokens.expiresAt, new Date())
                )
            )
            .limit(1);

        if (!resetToken) {
            return NextResponse.json(
                { error: "Invalid or expired reset link. Please request a new one." },
                { status: 400 }
            );
        }

        // Hash new password (salt rounds 10, matching existing signup pattern)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update password
        await db
            .update(users)
            .set({
                password: hashedPassword,
                updatedAt: new Date(),
            })
            .where(eq(users.id, resetToken.userId));

        // Mark token as used (prevents reuse)
        await db
            .update(passwordResetTokens)
            .set({ usedAt: new Date() })
            .where(eq(passwordResetTokens.id, resetToken.id));

        return NextResponse.json({
            message: "Password has been reset successfully.",
        });
    } catch (error) {
        console.error("[Reset Password] Error:", error);
        return NextResponse.json(
            { error: "An error occurred. Please try again." },
            { status: 500 }
        );
    }
}
