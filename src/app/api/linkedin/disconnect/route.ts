// src/app/api/linkedin/disconnect/route.ts
// Removes the LinkedIn account connection for the current user.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Delete the LinkedIn account row
        const result = await db
            .delete(accounts)
            .where(
                and(
                    eq(accounts.userId, session.user.id),
                    eq(accounts.provider, "linkedin")
                )
            );

        console.log("[LinkedIn Disconnect] Disconnected LinkedIn for user:", session.user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[LinkedIn Disconnect] Error:", error);
        return NextResponse.json(
            { error: "Failed to disconnect LinkedIn" },
            { status: 500 }
        );
    }
}
