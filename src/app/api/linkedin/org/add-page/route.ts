// src/app/api/linkedin/org/add-page/route.ts
// Look up a LinkedIn organization by vanity name and add it to the user's org list.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    getValidOrgAccessToken,
    getValidAccessToken,
    lookupOrganizationByVanityName,
    addOrgToAccount,
    getLinkedInOrgAccount,
} from "@/lib/linkedin";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const vanityName = (body.vanityName || "").trim().toLowerCase();

        if (!vanityName) {
            return NextResponse.json(
                { error: "Please enter a company vanity name" },
                { status: 400 }
            );
        }

        // Ensure an org account exists (even if token is expired, we need the record)
        const orgAccount = await getLinkedInOrgAccount(session.user.id);
        if (!orgAccount) {
            return NextResponse.json(
                { error: "Connect your LinkedIn organization account first in Settings." },
                { status: 401 }
            );
        }

        // Collect available tokens (org + personal) to try
        const tokens: string[] = [];
        const orgTokenResult = await getValidOrgAccessToken(session.user.id);
        if (orgTokenResult) tokens.push(orgTokenResult.accessToken);
        const personalTokenResult = await getValidAccessToken(session.user.id);
        if (personalTokenResult) tokens.push(personalTokenResult.accessToken);

        if (tokens.length === 0) {
            return NextResponse.json(
                { error: "LinkedIn tokens expired. Please reconnect your LinkedIn account in Settings." },
                { status: 401 }
            );
        }

        // Try each token until one works (org token may be revoked)
        let org = null;
        for (const token of tokens) {
            try {
                org = await lookupOrganizationByVanityName(token, vanityName);
                if (org) break;
            } catch (err) {
                // Auth error — try next token
                console.warn("[LinkedIn Org Add Page] Token failed, trying next:", err instanceof Error ? err.message : err);
                continue;
            }
        }

        if (!org) {
            return NextResponse.json(
                { error: `No organization found for "${vanityName}". Check the vanity name from your LinkedIn company URL.` },
                { status: 404 }
            );
        }

        // Add to the user's stored org list
        await addOrgToAccount(session.user.id, org);

        return NextResponse.json({
            success: true,
            org,
        });
    } catch (error) {
        console.error("[LinkedIn Org Add Page] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to add organization" },
            { status: 500 }
        );
    }
}
