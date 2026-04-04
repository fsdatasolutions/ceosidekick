// src/app/api/content/posts/batch-schedule/route.ts
// Schedule multiple posts at once for LinkedIn publishing

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
    getContentItemById,
    scheduleContentItem,
} from "@/lib/services/content-items";
import type { SchedulingMeta } from "@/lib/types/scheduling";

interface ScheduleEntry {
    postId: string;
    scheduledFor: string;
    postAs: string;
    visibility: "PUBLIC" | "CONNECTIONS";
}

interface BatchScheduleBody {
    schedules: ScheduleEntry[];
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = (await request.json()) as BatchScheduleBody;
        const { schedules } = body;

        if (!schedules || schedules.length === 0) {
            return NextResponse.json(
                { error: "At least one schedule entry is required" },
                { status: 400 }
            );
        }

        // Verify LinkedIn connection
        const postAs = schedules[0].postAs;
        const provider = postAs === "personal" ? "linkedin" : "linkedin_org";
        const [account] = await db
            .select()
            .from(accounts)
            .where(
                and(
                    eq(accounts.userId, session.user.id),
                    eq(accounts.provider, provider)
                )
            )
            .limit(1);

        if (!account) {
            return NextResponse.json(
                {
                    error: `LinkedIn ${postAs === "personal" ? "personal" : "organization"} account not connected`,
                },
                { status: 400 }
            );
        }

        const results: Array<{
            postId: string;
            success: boolean;
            error?: string;
        }> = [];

        for (const entry of schedules) {
            try {
                // Verify the post exists and belongs to user
                const post = await getContentItemById(
                    entry.postId,
                    session.user.id
                );

                if (!post) {
                    results.push({
                        postId: entry.postId,
                        success: false,
                        error: "Post not found",
                    });
                    continue;
                }

                if (post.status !== "draft" && post.status !== "failed") {
                    results.push({
                        postId: entry.postId,
                        success: false,
                        error: `Post is ${post.status}, must be draft or failed`,
                    });
                    continue;
                }

                // Validate scheduled time is in the future
                const scheduledDate = new Date(entry.scheduledFor);
                const fiveMinutesFromNow = new Date(
                    Date.now() + 5 * 60 * 1000
                );

                if (scheduledDate < fiveMinutesFromNow) {
                    results.push({
                        postId: entry.postId,
                        success: false,
                        error: "Scheduled time must be at least 5 minutes in the future",
                    });
                    continue;
                }

                const schedulingMeta: SchedulingMeta = {
                    postAs: entry.postAs,
                    visibility: entry.visibility,
                };

                await scheduleContentItem(
                    entry.postId,
                    session.user.id,
                    scheduledDate,
                    schedulingMeta
                );

                results.push({ postId: entry.postId, success: true });
            } catch (err) {
                console.error(
                    `[Batch Schedule] Failed to schedule post ${entry.postId}:`,
                    err
                );
                results.push({
                    postId: entry.postId,
                    success: false,
                    error: "Failed to schedule",
                });
            }
        }

        const succeeded = results.filter((r) => r.success).length;
        const failed = results.filter((r) => !r.success).length;

        return NextResponse.json({
            success: true,
            message: `Scheduled ${succeeded} of ${results.length} posts`,
            succeeded,
            failed,
            results,
        });
    } catch (error: unknown) {
        console.error("Batch schedule error:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Failed to batch schedule";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
