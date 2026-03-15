// src/app/api/linkedin/authorize/route.ts
// Initiates LinkedIn OAuth flow. Generates a random state, stores it in
// an httpOnly cookie, then redirects the user to LinkedIn's authorization page.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthorizationUrl, getRedirectUri } from "@/lib/linkedin";
import crypto from "crypto";

export async function GET(request: NextRequest) {
    try {
        // 1. Verify user is logged in
        const session = await auth();
        if (!session?.user?.id) {
            const loginUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "http://localhost:3000";
            return NextResponse.redirect(new URL("/login", loginUrl));
        }

        // 2. Check LinkedIn env vars are configured
        if (!process.env.LINKEDIN_CLIENT_ID || !process.env.LINKEDIN_CLIENT_SECRET) {
            console.error("[LinkedIn Auth] Missing LINKEDIN_CLIENT_ID or LINKEDIN_CLIENT_SECRET");
            return NextResponse.json(
                { error: "LinkedIn integration is not configured" },
                { status: 500 }
            );
        }

        // 3. Generate random state for CSRF protection
        const state = crypto.randomBytes(32).toString("hex");

        // 4. Build the LinkedIn authorization URL
        const authUrl = getAuthorizationUrl(state);

        // 5. Create redirect response and set state cookie
        const response = NextResponse.redirect(authUrl);

        response.cookies.set("linkedin_oauth_state", state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 600, // 10 minutes
        });

        // Pass force flag through a cookie so the callback knows the user
        // confirmed they want to reassign this LinkedIn account.
        const force = new URL(request.url).searchParams.get("force") === "true";
        response.cookies.set("linkedin_oauth_force", force ? "true" : "false", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 600,
        });

        console.log("[LinkedIn Auth] Redirect URI:", getRedirectUri());
        console.log("[LinkedIn Auth] Redirecting to LinkedIn authorization");
        return response;
    } catch (error) {
        console.error("[LinkedIn Auth] Error:", error);
        return NextResponse.json(
            { error: "Failed to initiate LinkedIn authorization" },
            { status: 500 }
        );
    }
}
