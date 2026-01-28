// src/app/api/content/campaigns/[id]/route.ts
// API route for retrieving a campaign session

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCampaignSession } from "@/lib/services/content-campaigns";

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET - Get a campaign session
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const userId = session.user.id;

        const campaign = getCampaignSession(id, userId);

        if (!campaign) {
            return NextResponse.json(
                { error: "Campaign not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ campaign });
    } catch (error: unknown) {
        console.error("Get campaign error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to get campaign";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
