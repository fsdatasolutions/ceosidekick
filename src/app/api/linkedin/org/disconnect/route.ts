// src/app/api/linkedin/org/disconnect/route.ts
// Removes the LinkedIn organization account connection for the current user.

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

        // Delete the LinkedIn org account row
        await db
            .delete(accounts)
            .where(
                and(
                    eq(accounts.userId, session.user.id),
                    eq(accounts.provider, "linkedin_org")
                )
            );

        console.log("[LinkedIn Org Disconnect] Disconnected org account for user:", session.user.id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[LinkedIn Org Disconnect] Error:", error);
        return NextResponse.json(
            { error: "Failed to disconnect LinkedIn organization" },
            { status: 500 }
        );
    }
}
