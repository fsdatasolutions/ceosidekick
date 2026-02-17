// src/app/api/linkedin/status/route.ts
// Returns the current user's LinkedIn connection status.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getLinkedInAccount, isTokenExpired, parseProfileFromIdToken } from "@/lib/linkedin";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if LinkedIn env vars are configured
        if (!process.env.LINKEDIN_CLIENT_ID) {
            return NextResponse.json({ connected: false, configured: false });
        }

        const account = await getLinkedInAccount(session.user.id);

        if (!account || !account.accessToken) {
            return NextResponse.json({ connected: false });
        }

        const tokenExpired = isTokenExpired(account.expiresAt);
        const profile = parseProfileFromIdToken(account.idToken);

        return NextResponse.json({
            connected: true,
            profile: profile
                ? { name: profile.name, personUrn: account.providerAccountId }
                : { personUrn: account.providerAccountId },
            tokenExpired,
        });
    } catch (error) {
        console.error("[LinkedIn Status] Error:", error);
        return NextResponse.json({ connected: false });
    }
}
