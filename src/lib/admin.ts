// src/lib/admin.ts
// Secure admin authorization utilities
// All admin checks are performed server-side against the database

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export type UserRole = "user" | "admin";

interface AdminCheckResult {
    isAdmin: boolean;
    role: UserRole;
    userId: string;
}

/**
 * Check if a user has admin privileges
 * Always performs a fresh database lookup - never trust client-side claims
 *
 * @param userId - The user ID from the authenticated session
 * @returns Admin check result with role information
 */
export async function checkAdminAccess(userId: string): Promise<AdminCheckResult> {
    if (!userId) {
        return { isAdmin: false, role: "user", userId: "" };
    }

    try {
        const result = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        const role = (result[0]?.role as UserRole) || "user";

        return {
            isAdmin: role === "admin",
            role,
            userId,
        };
    } catch (error) {
        console.error("[Admin Check] Database error:", error);
        // Fail secure - deny access on error
        return { isAdmin: false, role: "user", userId };
    }
}

/**
 * Require admin access - throws if not admin
 * Use this in API routes that require admin privileges
 *
 * @param userId - The user ID from the authenticated session
 * @throws Error if user is not an admin
 */
export async function requireAdmin(userId: string): Promise<void> {
    const { isAdmin } = await checkAdminAccess(userId);

    if (!isAdmin) {
        throw new Error("UNAUTHORIZED: Admin access required");
    }
}

/**
 * Get user role from database
 *
 * @param userId - The user ID
 * @returns The user's role
 */
export async function getUserRole(userId: string): Promise<UserRole> {
    const { role } = await checkAdminAccess(userId);
    return role;
}