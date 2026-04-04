// src/app/api/content/posts/suggest-schedule/route.ts
// Suggests optimal LinkedIn posting schedule for a batch of posts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

interface SuggestScheduleBody {
    postIds: string[];
    startDate?: string; // ISO date string, defaults to tomorrow
}

// Optimal LinkedIn posting times (hour in 24h format)
const OPTIMAL_TIMES = [
    { hour: 8, minute: 30 },  // Early morning
    { hour: 10, minute: 0 },  // Mid-morning
    { hour: 12, minute: 15 }, // Lunch
    { hour: 17, minute: 30 }, // End of workday
];

// Best days for LinkedIn engagement (Tue=2, Wed=3, Thu=4 are strongest)
const PREFERRED_DAYS = [2, 3, 4, 1, 5]; // Tue, Wed, Thu, Mon, Fri

function getNextPostingSlot(
    after: Date,
    slotIndex: number
): Date {
    const date = new Date(after);

    // Find next preferred weekday
    while (!PREFERRED_DAYS.includes(date.getDay())) {
        date.setDate(date.getDate() + 1);
    }

    // Pick a time slot cycling through optimal times
    const timeSlot = OPTIMAL_TIMES[slotIndex % OPTIMAL_TIMES.length];
    date.setHours(timeSlot.hour, timeSlot.minute, 0, 0);

    // If this time has already passed today, move to next preferred day
    if (date <= after) {
        date.setDate(date.getDate() + 1);
        while (!PREFERRED_DAYS.includes(date.getDay())) {
            date.setDate(date.getDate() + 1);
        }
        date.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
    }

    return date;
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = (await request.json()) as SuggestScheduleBody;
        const { postIds, startDate } = body;

        if (!postIds || postIds.length === 0) {
            return NextResponse.json(
                { error: "At least one post ID is required" },
                { status: 400 }
            );
        }

        // Start from provided date or tomorrow
        let cursor = startDate ? new Date(startDate) : new Date();
        if (!startDate) {
            // Default to tomorrow morning
            cursor.setDate(cursor.getDate() + 1);
            cursor.setHours(0, 0, 0, 0);
        }

        const suggestions: Array<{
            postId: string;
            suggestedDate: string;
        }> = [];

        let timeSlotIndex = 0;

        for (const postId of postIds) {
            const slot = getNextPostingSlot(cursor, timeSlotIndex);

            suggestions.push({
                postId,
                suggestedDate: slot.toISOString(),
            });

            // Space posts: if we've used all time slots for this day, advance to next preferred day
            timeSlotIndex++;
            if (timeSlotIndex % OPTIMAL_TIMES.length === 0) {
                // Move to next day (at least 1 day gap)
                cursor = new Date(slot);
                cursor.setDate(cursor.getDate() + 1);
                cursor.setHours(0, 0, 0, 0);
                timeSlotIndex = 0;
            } else {
                // Stay on same day but advance cursor past this slot
                cursor = new Date(slot);
                cursor.setMinutes(cursor.getMinutes() + 1);
            }
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
