// src/app/api/linkedin/org/authorize/route.ts
// Initiates LinkedIn OAuth flow for the Organization app (Community Management API).
// Generates a random state, stores it in an httpOnly cookie, then redirects
// the user to LinkedIn's authorization page with org scopes.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrgAuthorizationUrl, getOrgRedirectUri } from "@/lib/linkedin";
import crypto from "crypto";

export async function GET() {
    try {
        // 1. Verify user is logged in
        const session = await auth();
        if (!session?.user?.id) {
            const loginUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";
            return NextResponse.redirect(new URL("/login", loginUrl));
        }

        // 2. Check LinkedIn org env vars are configured
        if (!process.env.LINKEDIN_ORG_CLIENT_ID || !process.env.LINKEDIN_ORG_CLIENT_SECRET) {
            console.error("[LinkedIn Org Auth] Missing LINKEDIN_ORG_CLIENT_ID or LINKEDIN_ORG_CLIENT_SECRET");
            return NextResponse.json(
                { error: "LinkedIn organization integration is not configured" },
                { status: 500 }
            );
        }

        // 3. Generate CSRF state
        const state = crypto.randomBytes(32).toString("hex");

        // 4. Build authorization URL and redirect
        const authUrl = getOrgAuthorizationUrl(state);
        const response = NextResponse.redirect(authUrl);

        // 5. Store state in httpOnly cookie for CSRF validation
        response.cookies.set("linkedin_org_oauth_state", state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 600, // 10 minutes
        });

        console.log("[LinkedIn Org Auth] Redirect URI:", getOrgRedirectUri());
        console.log("[LinkedIn Org Auth] Redirecting to LinkedIn authorization (org scopes)");
        return response;
    } catch (error) {
        console.error("[LinkedIn Org Auth] Error:", error);
        return NextResponse.json(
            { error: "Failed to initiate LinkedIn organization authorization" },
            { status: 500 }
        );
    }
}
