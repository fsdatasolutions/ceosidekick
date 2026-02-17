// src/app/api/content/[id]/schedule/route.ts
// Schedule or cancel a LinkedIn content item for future publishing

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    getContentItemById,
    scheduleContentItem,
    cancelSchedule,
} from "@/lib/services/content-items";
import { getValidAccessToken, getValidOrgAccessToken } from "@/lib/linkedin";
import type { SchedulingMeta } from "@/lib/types/scheduling";

/**
 * POST /api/content/[id]/schedule
 * Schedule a content item for future LinkedIn publishing.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const userId = session.user.id;

        // Verify the content item exists and belongs to this user
        const item = await getContentItemById(id, userId);
        if (!item) {
            return NextResponse.json(
                { error: "Content item not found" },
                { status: 404 }
            );
        }

        // Only draft or failed items can be scheduled
        if (item.status !== "draft" && item.status !== "failed") {
            return NextResponse.json(
                { error: `Cannot schedule an item with status "${item.status}"` },
                { status: 400 }
            );
        }

        // Only LinkedIn content can be scheduled
        if (item.type !== "linkedin_post" && item.type !== "linkedin_article") {
            return NextResponse.json(
                { error: "Only LinkedIn posts and articles can be scheduled" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const {
            scheduledFor,
            postAs = "personal",
            visibility = "PUBLIC",
            articleUrl,
            articleTitle,
            articleDescription,
        } = body as {
            scheduledFor: string;
            postAs?: string;
            visibility?: "PUBLIC" | "CONNECTIONS";
            articleUrl?: string;
            articleTitle?: string;
            articleDescription?: string;
        };

        // Validate scheduled time
        const scheduledDate = new Date(scheduledFor);
        if (isNaN(scheduledDate.getTime())) {
            return NextResponse.json(
                { error: "Invalid date format" },
                { status: 400 }
            );
        }

        const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
        if (scheduledDate < fiveMinutesFromNow) {
            return NextResponse.json(
                { error: "Scheduled time must be at least 5 minutes in the future" },
                { status: 400 }
            );
        }

        // Verify LinkedIn account is connected
        const isOrgPost = postAs && postAs !== "personal";
        if (isOrgPost) {
            const orgToken = await getValidOrgAccessToken(userId);
            if (!orgToken) {
                return NextResponse.json(
                    { error: "LinkedIn organization account not connected or token expired. Please reconnect." },
                    { status: 400 }
                );
            }
        } else {
            const personalToken = await getValidAccessToken(userId);
            if (!personalToken) {
                return NextResponse.json(
                    { error: "LinkedIn account not connected or token expired. Please reconnect." },
                    { status: 400 }
                );
            }
        }

        // Build scheduling metadata
        const schedulingMeta: SchedulingMeta = {
            postAs,
            visibility,
            ...(articleUrl && { articleUrl }),
            ...(articleTitle && { articleTitle }),
            ...(articleDescription && { articleDescription }),
        };

        // Schedule the item
        const updatedItem = await scheduleContentItem(
            id,
            userId,
            scheduledDate,
            schedulingMeta
        );

        if (!updatedItem) {
            return NextResponse.json(
                { error: "Failed to schedule content item" },
                { status: 500 }
            );
        }

        console.log(
            "[Schedule] Content item scheduled:",
            id,
            "for",
            scheduledDate.toISOString()
        );

        return NextResponse.json({
            success: true,
            item: updatedItem,
        });
    } catch (error) {
        console.error("[Schedule] Error:", error);
        return NextResponse.json(
            { error: "Failed to schedule content item" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/content/[id]/schedule
 * Cancel a scheduled content item, reverting it to draft.
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const userId = session.user.id;

        const updatedItem = await cancelSchedule(id, userId);

        if (!updatedItem) {
            return NextResponse.json(
                { error: "Content item not found or not currently scheduled" },
                { status: 404 }
            );
        }

        console.log("[Schedule] Schedule cancelled for content item:", id);

        return NextResponse.json({
            success: true,
            item: updatedItem,
        });
    } catch (error) {
        console.error("[Schedule] Cancel error:", error);
        return NextResponse.json(
            { error: "Failed to cancel schedule" },
            { status: 500 }
        );
    }
}
