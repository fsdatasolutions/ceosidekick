// src/app/api/linkedin/callback/route.ts
// Handles the OAuth callback from LinkedIn. Exchanges the authorization code
// for tokens, fetches the user's profile, and upserts into the accounts table.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exchangeCodeForTokens, getUserProfile } from "@/lib/linkedin";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        // 1. Verify user is logged in
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.redirect(
                new URL("/login", process.env.NEXTAUTH_URL || "http://localhost:3000")
            );
        }

        const userId = session.user.id;
        const { searchParams } = new URL(request.url);
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        // 2. Handle LinkedIn errors (user denied access, etc.)
        if (error) {
            console.error("[LinkedIn Callback] OAuth error:", error, errorDescription);
            const redirectUrl = new URL("/settings", process.env.NEXTAUTH_URL || "http://localhost:3000");
            redirectUrl.searchParams.set("linkedin", "error");
            redirectUrl.searchParams.set("linkedin_error", errorDescription || error);
            return NextResponse.redirect(redirectUrl);
        }

        // 3. Validate required parameters
        if (!code || !state) {
            console.error("[LinkedIn Callback] Missing code or state");
            return NextResponse.redirect(
                new URL("/settings?linkedin=error&linkedin_error=Missing+parameters", process.env.NEXTAUTH_URL || "http://localhost:3000")
            );
        }

        // 4. Verify state matches cookie (CSRF protection)
        const storedState = request.cookies.get("linkedin_oauth_state")?.value;
        if (!storedState || storedState !== state) {
            console.error("[LinkedIn Callback] State mismatch — possible CSRF attack");
            return NextResponse.redirect(
                new URL("/settings?linkedin=error&linkedin_error=Invalid+state", process.env.NEXTAUTH_URL || "http://localhost:3000")
            );
        }

        // 5. Exchange code for tokens
        console.log("[LinkedIn Callback] Exchanging authorization code for tokens...");
        const tokens = await exchangeCodeForTokens(code);

        // 6. Fetch LinkedIn profile
        console.log("[LinkedIn Callback] Fetching LinkedIn profile...");
        const profile = await getUserProfile(tokens.access_token);
        console.log("[LinkedIn Callback] Profile fetched:", profile.name);

        // 7. Calculate token expiry timestamp
        const expiresAt = Math.floor(Date.now() / 1000) + tokens.expires_in;

        // 8. Store profile data in idToken column as JSON
        const profileJson = JSON.stringify({
            name: profile.name,
            email: profile.email,
        });

        // 9. Upsert into accounts table
        const existing = await db
            .select()
            .from(accounts)
            .where(
                and(
                    eq(accounts.userId, userId),
                    eq(accounts.provider, "linkedin")
                )
            )
            .limit(1);

        if (existing.length > 0) {
            // Update existing LinkedIn account
            await db
                .update(accounts)
                .set({
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token || null,
                    expiresAt,
                    scope: tokens.scope,
                    tokenType: tokens.token_type,
                    providerAccountId: profile.sub,
                    idToken: profileJson,
                })
                .where(eq(accounts.id, existing[0].id));
            console.log("[LinkedIn Callback] Updated existing LinkedIn account");
        } else {
            // Create new LinkedIn account entry
            await db.insert(accounts).values({
                userId,
                type: "oauth",
                provider: "linkedin",
                providerAccountId: profile.sub,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || null,
                expiresAt,
                tokenType: tokens.token_type,
                scope: tokens.scope,
                idToken: profileJson,
            });
            console.log("[LinkedIn Callback] Created new LinkedIn account entry");
        }

        // 10. Clear state cookie and redirect to settings with success
        const redirectUrl = new URL("/settings", process.env.NEXTAUTH_URL || "http://localhost:3000");
        redirectUrl.searchParams.set("linkedin", "connected");

        const response = NextResponse.redirect(redirectUrl);
        response.cookies.delete("linkedin_oauth_state");

        return response;
    } catch (error) {
        console.error("[LinkedIn Callback] Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const redirectUrl = new URL("/settings", process.env.NEXTAUTH_URL || "http://localhost:3000");
        redirectUrl.searchParams.set("linkedin", "error");
        redirectUrl.searchParams.set("linkedin_error", errorMessage);
        return NextResponse.redirect(redirectUrl);
    }
}
