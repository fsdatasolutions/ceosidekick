// src/app/api/linkedin/org/status/route.ts
// Returns the current user's LinkedIn organization connection status,
// including the list of administered organization pages.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLinkedInOrgAccount, isTokenExpired, parseOrgListFromIdToken } from "@/lib/linkedin";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if LinkedIn org env vars are configured
        if (!process.env.LINKEDIN_ORG_CLIENT_ID) {
            return NextResponse.json({ connected: false, configured: false });
        }

        const account = await getLinkedInOrgAccount(session.user.id);

        if (!account || !account.accessToken) {
            return NextResponse.json({ connected: false });
        }

        const tokenExpired = isTokenExpired(account.expiresAt);
        const orgs = parseOrgListFromIdToken(account.idToken);

        return NextResponse.json({
            connected: true,
            orgs,
            tokenExpired,
        });
    } catch (error) {
        console.error("[LinkedIn Org Status] Error:", error);
        return NextResponse.json({ connected: false });
    }
}
