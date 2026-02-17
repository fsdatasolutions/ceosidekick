// src/lib/linkedin.ts
// LinkedIn API client utilities for OAuth and posting.
// This is a custom OAuth flow (separate from NextAuth) because LinkedIn
// is used as a "connected account" for posting, NOT as a sign-in provider.
//
// Supports two LinkedIn apps:
//   1. Personal (provider: "linkedin") — uses Sign In / Share products
//   2. Organization (provider: "linkedin_org") — uses Community Management API

import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// ============================================
// CONSTANTS
// ============================================

const LINKEDIN_AUTH_URL = "https://www.linkedin.com/oauth/v2/authorization";
const LINKEDIN_TOKEN_URL = "https://www.linkedin.com/oauth/v2/accessToken";
const LINKEDIN_USERINFO_URL = "https://api.linkedin.com/v2/userinfo";
const LINKEDIN_POSTS_URL = "https://api.linkedin.com/rest/posts";
const LINKEDIN_API_VERSION = "202601";

// Personal app scopes (Sign In + Share products)
const SCOPES = ["openid", "profile", "w_member_social"];

// Organization app scopes (Community Management API)
const ORG_SCOPES = ["w_organization_social", "r_organization_social"];

// ============================================
// TYPES
// ============================================

export interface LinkedInTokens {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    refresh_token_expires_in?: number;
    scope: string;
    token_type: string;
}

export interface LinkedInProfile {
    sub: string;        // Person URN, e.g. "urn:li:person:ABC123"
    name: string;
    email?: string;
    picture?: string;
}

export interface LinkedInPostOptions {
    authorUrn: string;
    commentary: string;
    visibility?: "PUBLIC" | "CONNECTIONS";
    article?: {
        source: string;       // The URL to share (creates a link-preview card)
        title?: string;       // Title for the link preview
        description?: string; // Description for the link preview
    };
}

export interface LinkedInOrg {
    id: string;         // Organization ID (numeric string)
    name: string;
    vanityName?: string;
    logoUrl?: string;
}

interface LinkedInAccountRow {
    id: string;
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
    providerAccountId: string;
    idToken: string | null;
}

// ============================================
// HELPERS
// ============================================

/**
 * Resolve the application base URL from environment variables.
 * Checks NEXTAUTH_URL, AUTH_URL, then falls back to localhost.
 */
function getAppBaseUrl(): string {
    const url =
        process.env.NEXTAUTH_URL ||
        process.env.AUTH_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        "http://localhost:3000";
    // Remove trailing slash
    return url.replace(/\/$/, "");
}

/**
 * Build the redirect URI for LinkedIn personal OAuth callbacks.
 */
export function getRedirectUri(): string {
    return `${getAppBaseUrl()}/api/linkedin/callback`;
}

/**
 * Build the redirect URI for LinkedIn org OAuth callbacks.
 */
export function getOrgRedirectUri(): string {
    return `${getAppBaseUrl()}/api/linkedin/org/callback`;
}

// ============================================
// OAUTH FLOW — PERSONAL
// ============================================

/**
 * Build the LinkedIn OAuth authorization URL (personal app).
 */
export function getAuthorizationUrl(state: string): string {
    const redirectUri = getRedirectUri();
    const params = new URLSearchParams({
        response_type: "code",
        client_id: process.env.LINKEDIN_CLIENT_ID || "",
        redirect_uri: redirectUri,
        state,
        scope: SCOPES.join(" "),
    });
    return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange an authorization code for access and refresh tokens (personal app).
 */
export async function exchangeCodeForTokens(code: string): Promise<LinkedInTokens> {
    const redirectUri = getRedirectUri();

    const response = await fetch(LINKEDIN_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            client_id: process.env.LINKEDIN_CLIENT_ID || "",
            client_secret: process.env.LINKEDIN_CLIENT_SECRET || "",
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("[LinkedIn] Token exchange failed:", errorText);
        throw new Error(`LinkedIn token exchange failed: ${response.status}`);
    }

    return response.json();
}

/**
 * Fetch the authenticated user's LinkedIn profile.
 */
export async function getUserProfile(accessToken: string): Promise<LinkedInProfile> {
    const response = await fetch(LINKEDIN_USERINFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("[LinkedIn] Profile fetch failed:", errorText);
        throw new Error(`LinkedIn profile fetch failed: ${response.status}`);
    }

    return response.json();
}

// ============================================
// OAUTH FLOW — ORGANIZATION
// ============================================

/**
 * Build the LinkedIn OAuth authorization URL (organization app).
 */
export function getOrgAuthorizationUrl(state: string): string {
    const redirectUri = getOrgRedirectUri();
    const params = new URLSearchParams({
        response_type: "code",
        client_id: process.env.LINKEDIN_ORG_CLIENT_ID || "",
        redirect_uri: redirectUri,
        state,
        scope: ORG_SCOPES.join(" "),
    });
    return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange an authorization code for tokens (organization app).
 */
export async function exchangeOrgCodeForTokens(code: string): Promise<LinkedInTokens> {
    const redirectUri = getOrgRedirectUri();

    const response = await fetch(LINKEDIN_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            code,
            redirect_uri: redirectUri,
            client_id: process.env.LINKEDIN_ORG_CLIENT_ID || "",
            client_secret: process.env.LINKEDIN_ORG_CLIENT_SECRET || "",
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("[LinkedIn Org] Token exchange failed:", errorText);
        throw new Error(`LinkedIn org token exchange failed: ${response.status}`);
    }

    return response.json();
}

/**
 * Fetch the organization pages administered by the authenticated user.
 * Uses the Community Management API's organizationAcls endpoint.
 */
export async function getAdministeredOrganizations(accessToken: string): Promise<LinkedInOrg[]> {
    // Step 1: Get organization ACLs for the user (as ADMINISTRATOR)
    const aclUrl = `https://api.linkedin.com/rest/organizationAcls?q=roleAssignee&role=ADMINISTRATOR`;

    const aclResponse = await fetch(aclUrl, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "LinkedIn-Version": LINKEDIN_API_VERSION,
            "X-Restli-Protocol-Version": "2.0.0",
        },
    });

    if (!aclResponse.ok) {
        const errorText = await aclResponse.text();
        console.error("[LinkedIn Org] Failed to fetch organization ACLs:", aclResponse.status, errorText);
        return [];
    }

    const aclData = await aclResponse.json();
    const elements = aclData.elements || [];

    if (elements.length === 0) {
        console.log("[LinkedIn Org] No administered organizations found");
        return [];
    }

    // Step 2: Extract organization URNs and fetch details for each
    const orgs: LinkedInOrg[] = [];

    for (const element of elements) {
        // The organization field is a URN like "urn:li:organization:12345"
        const orgUrn: string = element.organization || "";
        const orgId = orgUrn.replace("urn:li:organization:", "");

        if (!orgId) continue;

        try {
            // Fetch organization details
            const orgResponse = await fetch(
                `https://api.linkedin.com/rest/organizations/${orgId}`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "LinkedIn-Version": LINKEDIN_API_VERSION,
                        "X-Restli-Protocol-Version": "2.0.0",
                    },
                }
            );

            if (orgResponse.ok) {
                const orgData = await orgResponse.json();
                orgs.push({
                    id: orgId,
                    name: orgData.localizedName || orgData.name || `Organization ${orgId}`,
                    vanityName: orgData.vanityName,
                    logoUrl: orgData.logoV2?.original || undefined,
                });
            } else {
                // If we can't fetch details, still include the org with just the ID
                console.warn(`[LinkedIn Org] Failed to fetch details for org ${orgId}`);
                orgs.push({
                    id: orgId,
                    name: `Organization ${orgId}`,
                });
            }
        } catch (err) {
            console.error(`[LinkedIn Org] Error fetching org ${orgId}:`, err);
            orgs.push({
                id: orgId,
                name: `Organization ${orgId}`,
            });
        }
    }

    return orgs;
}

// ============================================
// TOKEN REFRESH (shared between personal & org)
// ============================================

/**
 * Refresh an expired access token using the refresh token.
 * Accepts optional clientId/clientSecret to support both personal and org apps.
 */
export async function refreshAccessToken(
    refreshToken: string,
    clientId?: string,
    clientSecret?: string
): Promise<LinkedInTokens> {
    const response = await fetch(LINKEDIN_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "refresh_token",
            refresh_token: refreshToken,
            client_id: clientId || process.env.LINKEDIN_CLIENT_ID || "",
            client_secret: clientSecret || process.env.LINKEDIN_CLIENT_SECRET || "",
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("[LinkedIn] Token refresh failed:", errorText);
        throw new Error(`LinkedIn token refresh failed: ${response.status}`);
    }

    return response.json();
}

// ============================================
// POSTS API
// ============================================

/**
 * Create a post on LinkedIn via the Posts API.
 */
export async function createPost(
    accessToken: string,
    options: LinkedInPostOptions
): Promise<{ success: boolean; postId?: string; error?: string }> {
    const { authorUrn, commentary, visibility = "PUBLIC", article } = options;

    const body: Record<string, unknown> = {
        author: authorUrn,
        commentary,
        visibility,
        distribution: {
            feedDistribution: "MAIN_FEED",
            targetEntities: [],
            thirdPartyDistributionChannels: [],
        },
        lifecycleState: "PUBLISHED",
    };

    // Add article content for link-share posts (creates a link preview card)
    if (article?.source) {
        body.content = {
            article: {
                source: article.source,
                ...(article.title && { title: article.title }),
                ...(article.description && { description: article.description }),
            },
        };
    }

    const response = await fetch(LINKEDIN_POSTS_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "LinkedIn-Version": LINKEDIN_API_VERSION,
            "X-Restli-Protocol-Version": "2.0.0",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("[LinkedIn] Post creation failed:", response.status, errorText);

        // Parse LinkedIn error for user-friendly message
        try {
            const errorData = JSON.parse(errorText);
            return {
                success: false,
                error: errorData.message || `LinkedIn API error: ${response.status}`,
            };
        } catch {
            return { success: false, error: `LinkedIn API error: ${response.status}` };
        }
    }

    // LinkedIn returns 201 Created with post ID in x-restli-id header
    const postId = response.headers.get("x-restli-id") || undefined;
    return { success: true, postId };
}

// ============================================
// ACCOUNT MANAGEMENT — PERSONAL
// ============================================

/**
 * Get the LinkedIn personal account row for a user from the accounts table.
 */
export async function getLinkedInAccount(userId: string): Promise<LinkedInAccountRow | null> {
    try {
        const results = await db
            .select({
                id: accounts.id,
                accessToken: accounts.accessToken,
                refreshToken: accounts.refreshToken,
                expiresAt: accounts.expiresAt,
                providerAccountId: accounts.providerAccountId,
                idToken: accounts.idToken,
            })
            .from(accounts)
            .where(
                and(
                    eq(accounts.userId, userId),
                    eq(accounts.provider, "linkedin")
                )
            )
            .limit(1);

        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.error("[LinkedIn] Failed to query account:", error);
        return null;
    }
}

// ============================================
// ACCOUNT MANAGEMENT — ORGANIZATION
// ============================================

/**
 * Get the LinkedIn org account row for a user from the accounts table.
 */
export async function getLinkedInOrgAccount(userId: string): Promise<LinkedInAccountRow | null> {
    try {
        const results = await db
            .select({
                id: accounts.id,
                accessToken: accounts.accessToken,
                refreshToken: accounts.refreshToken,
                expiresAt: accounts.expiresAt,
                providerAccountId: accounts.providerAccountId,
                idToken: accounts.idToken,
            })
            .from(accounts)
            .where(
                and(
                    eq(accounts.userId, userId),
                    eq(accounts.provider, "linkedin_org")
                )
            )
            .limit(1);

        return results.length > 0 ? results[0] : null;
    } catch (error) {
        console.error("[LinkedIn Org] Failed to query account:", error);
        return null;
    }
}

/**
 * Parse the org list stored in the idToken column of the org account.
 * Format: { orgs: [{ id, name, vanityName?, logoUrl? }] }
 */
export function parseOrgListFromIdToken(idToken: string | null): LinkedInOrg[] {
    if (!idToken) return [];
    try {
        const data = JSON.parse(idToken);
        return data.orgs || [];
    } catch {
        return [];
    }
}

// ============================================
// SHARED UTILITIES
// ============================================

/**
 * Check if a token timestamp has expired.
 */
export function isTokenExpired(expiresAt: number | null): boolean {
    if (!expiresAt) return true;
    // Add a 5-minute buffer to avoid edge cases
    return Date.now() / 1000 > expiresAt - 300;
}

/**
 * Parse the LinkedIn profile info stored in the idToken column (personal account).
 */
export function parseProfileFromIdToken(idToken: string | null): { name: string; email?: string } | null {
    if (!idToken) return null;
    try {
        return JSON.parse(idToken);
    } catch {
        return null;
    }
}

/**
 * Get a valid access token for the user's personal LinkedIn account, refreshing if necessary.
 * Returns null if the user needs to reconnect.
 */
export async function getValidAccessToken(userId: string): Promise<{
    accessToken: string;
    account: LinkedInAccountRow;
} | null> {
    const account = await getLinkedInAccount(userId);
    if (!account || !account.accessToken) return null;

    // Token is still valid
    if (!isTokenExpired(account.expiresAt)) {
        return { accessToken: account.accessToken, account };
    }

    // Try to refresh
    if (!account.refreshToken) {
        console.warn("[LinkedIn] Token expired and no refresh token available");
        return null;
    }

    try {
        console.log("[LinkedIn] Refreshing expired access token...");
        const tokens = await refreshAccessToken(account.refreshToken);

        // Update the stored tokens
        await db
            .update(accounts)
            .set({
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || account.refreshToken,
                expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
                scope: tokens.scope,
            })
            .where(eq(accounts.id, account.id));

        console.log("[LinkedIn] Token refreshed successfully");
        return {
            accessToken: tokens.access_token,
            account: {
                ...account,
                accessToken: tokens.access_token,
                expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
            },
        };
    } catch (error) {
        console.error("[LinkedIn] Token refresh failed:", error);
        return null;
    }
}

/**
 * Get a valid access token for the user's org LinkedIn account, refreshing if necessary.
 * Returns null if the user needs to reconnect.
 */
export async function getValidOrgAccessToken(userId: string): Promise<{
    accessToken: string;
    account: LinkedInAccountRow;
} | null> {
    const account = await getLinkedInOrgAccount(userId);
    if (!account || !account.accessToken) return null;

    // Token is still valid
    if (!isTokenExpired(account.expiresAt)) {
        return { accessToken: account.accessToken, account };
    }

    // Try to refresh using org app credentials
    if (!account.refreshToken) {
        console.warn("[LinkedIn Org] Token expired and no refresh token available");
        return null;
    }

    try {
        console.log("[LinkedIn Org] Refreshing expired access token...");
        const tokens = await refreshAccessToken(
            account.refreshToken,
            process.env.LINKEDIN_ORG_CLIENT_ID,
            process.env.LINKEDIN_ORG_CLIENT_SECRET
        );

        // Update the stored tokens
        await db
            .update(accounts)
            .set({
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || account.refreshToken,
                expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
                scope: tokens.scope,
            })
            .where(eq(accounts.id, account.id));

        console.log("[LinkedIn Org] Token refreshed successfully");
        return {
            accessToken: tokens.access_token,
            account: {
                ...account,
                accessToken: tokens.access_token,
                expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
            },
        };
    } catch (error) {
        console.error("[LinkedIn Org] Token refresh failed:", error);
        return null;
    }
}
