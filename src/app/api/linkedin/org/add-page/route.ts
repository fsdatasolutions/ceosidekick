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

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const vanityName = (body.vanityName || "").trim();
        const manualOrgId = (body.orgId || "").trim();

        if (!vanityName && !manualOrgId) {
            return NextResponse.json(
                { error: "Please enter a company vanity name or organization ID" },
                { status: 400 }
            );
        }

        // Ensure an org account exists
        const orgAccount = await getLinkedInOrgAccount(session.user.id);
        if (!orgAccount) {
            return NextResponse.json(
                { error: "Connect your LinkedIn organization account first in Settings." },
                { status: 401 }
            );
        }

        // If manual org ID is provided, save directly without API lookup
        if (manualOrgId) {
            const org = {
                id: manualOrgId,
                name: vanityName || `Organization ${manualOrgId}`,
                vanityName: vanityName || undefined,
            };
            await addOrgToAccount(session.user.id, org);
            return NextResponse.json({ success: true, org });
        }

        // Otherwise, try API lookup with available tokens
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

        // Try each token until one works
        let org = null;
        for (const token of tokens) {
            try {
                org = await lookupOrganizationByVanityName(token, vanityName);
                if (org) break;
            } catch (err) {
                console.warn("[LinkedIn Org Add Page] Token failed, trying next:", err instanceof Error ? err.message : err);
                continue;
            }
        }

        if (!org) {
            // API lookup failed — tell user to provide org ID manually
            return NextResponse.json(
                { error: `Could not look up "${vanityName}" via LinkedIn API. Try entering your Organization ID instead (find it in your LinkedIn Page admin URL).`, needsManualId: true },
                { status: 404 }
            );
        }

        await addOrgToAccount(session.user.id, org);
        return NextResponse.json({ success: true, org });
    } catch (error) {
        console.error("[LinkedIn Org Add Page] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to add organization" },
            { status: 500 }
        );
    }
}
