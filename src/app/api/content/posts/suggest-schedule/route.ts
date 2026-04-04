// src/app/api/content/posts/suggest-schedule/route.ts
// Suggests a once-per-day posting schedule starting from a user-selected date/time

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

interface SuggestScheduleBody {
    postIds: string[];
    startDateTime: string; // ISO date string — first post publishes at this exact time
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = (await request.json()) as SuggestScheduleBody;
        const { postIds, startDateTime } = body;

        if (!postIds || postIds.length === 0) {
            return NextResponse.json(
                { error: "At least one post ID is required" },
                { status: 400 }
            );
        }

        if (!startDateTime) {
            return NextResponse.json(
                { error: "Start date/time is required" },
                { status: 400 }
            );
        }

        const start = new Date(startDateTime);

        const suggestions: Array<{
            postId: string;
            suggestedDate: string;
        }> = [];

        for (let i = 0; i < postIds.length; i++) {
            const slot = new Date(start);
            slot.setDate(slot.getDate() + i); // one post per day
            suggestions.push({
                postId: postIds[i],
                suggestedDate: slot.toISOString(),
            });
        }

        return NextResponse.json({
            success: true,
            suggestions,
        });
    } catch (error: unknown) {
        console.error("Suggest schedule error:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Failed to suggest schedule";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
