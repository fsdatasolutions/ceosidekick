// src/app/api/linkedin/org/callback/route.ts
// Handles the OAuth callback from LinkedIn for the Organization app.
// Exchanges the authorization code for tokens, fetches administered organizations,
// and upserts into the accounts table with provider "linkedin_org".

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { exchangeOrgCodeForTokens, getAdministeredOrganizations } from "@/lib/linkedin";
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
            console.error("[LinkedIn Org Callback] OAuth error:", error, errorDescription);
            const redirectUrl = new URL("/settings", process.env.NEXTAUTH_URL || "http://localhost:3000");
            redirectUrl.searchParams.set("linkedin_org", "error");
            redirectUrl.searchParams.set("linkedin_org_error", errorDescription || error);
            return NextResponse.redirect(redirectUrl);
        }

        // 3. Validate required parameters
        if (!code || !state) {
            console.error("[LinkedIn Org Callback] Missing code or state");
            return NextResponse.redirect(
                new URL("/settings?linkedin_org=error&linkedin_org_error=Missing+parameters", process.env.NEXTAUTH_URL || "http://localhost:3000")
            );
        }

        // 4. Verify state matches cookie (CSRF protection)
        const storedState = request.cookies.get("linkedin_org_oauth_state")?.value;
        if (!storedState || storedState !== state) {
            console.error("[LinkedIn Org Callback] State mismatch — possible CSRF attack");
            return NextResponse.redirect(
                new URL("/settings?linkedin_org=error&linkedin_org_error=Invalid+state", process.env.NEXTAUTH_URL || "http://localhost:3000")
            );
        }

        // 5. Exchange code for tokens
        console.log("[LinkedIn Org Callback] Exchanging authorization code for tokens...");
        const tokens = await exchangeOrgCodeForTokens(code);

        // 6. Fetch administered organizations
        console.log("[LinkedIn Org Callback] Fetching administered organizations...");
        const orgs = await getAdministeredOrganizations(tokens.access_token);
        console.log("[LinkedIn Org Callback] Found", orgs.length, "administered organizations");

        // 7. Calculate token expiry timestamp
        const expiresAt = Math.floor(Date.now() / 1000) + tokens.expires_in;

        // 8. Store org list in idToken column as JSON
        const orgDataJson = JSON.stringify({ orgs });

        // 9. Use the first org ID as providerAccountId (or "org_user" if none found)
        const providerAccountId = orgs.length > 0 ? `org_${orgs[0].id}` : `org_user_${userId.slice(0, 8)}`;

        // 10. Upsert into accounts table
        // Check by provider + providerAccountId to match the unique index,
        // so we update rather than conflict if this org was previously linked.
        const existing = await db
            .select()
            .from(accounts)
            .where(
                and(
                    eq(accounts.provider, "linkedin_org"),
                    eq(accounts.providerAccountId, providerAccountId)
                )
            )
            .limit(1);

        if (existing.length > 0) {
            // Update existing org account (reassign to current user)
            await db
                .update(accounts)
                .set({
                    userId,
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token || null,
                    expiresAt,
                    scope: tokens.scope,
                    tokenType: tokens.token_type,
                    idToken: orgDataJson,
                })
                .where(eq(accounts.id, existing[0].id));
            console.log("[LinkedIn Org Callback] Updated existing org account");
        } else {
            // Create new org account entry
            await db.insert(accounts).values({
                userId,
                type: "oauth",
                provider: "linkedin_org",
                providerAccountId,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || null,
                expiresAt,
                tokenType: tokens.token_type,
                scope: tokens.scope,
                idToken: orgDataJson,
            });
            console.log("[LinkedIn Org Callback] Created new org account entry");
        }

        // 11. Clear state cookie and redirect to settings with success
        const redirectUrl = new URL("/settings", process.env.NEXTAUTH_URL || "http://localhost:3000");
        redirectUrl.searchParams.set("linkedin_org", "connected");

        const response = NextResponse.redirect(redirectUrl);
        response.cookies.delete("linkedin_org_oauth_state");

        return response;
    } catch (error) {
        console.error("[LinkedIn Org Callback] Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        const redirectUrl = new URL("/settings", process.env.NEXTAUTH_URL || "http://localhost:3000");
        redirectUrl.searchParams.set("linkedin_org", "error");
        redirectUrl.searchParams.set("linkedin_org_error", errorMessage);
        return NextResponse.redirect(redirectUrl);
    }
}
