// src/app/api/cron/publish-scheduled/route.ts
// Cron-triggered endpoint that publishes scheduled LinkedIn content.
// Called externally every 5 minutes with a Bearer token for auth.

import { NextRequest, NextResponse } from "next/server";
import {
    getScheduledDueItems,
    markContentFailed,
    markContentPublished,
} from "@/lib/services/content-items";
import {
    createPost,
    getValidAccessToken,
    getValidOrgAccessToken,
} from "@/lib/linkedin";
import type { SchedulingMeta } from "@/lib/types/scheduling";

const MAX_RETRIES = 3;

export async function POST(request: NextRequest) {
    // Verify CRON_SECRET
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all items due for publishing
    const dueItems = await getScheduledDueItems();

    if (dueItems.length === 0) {
        return NextResponse.json({ message: "No items due", processed: 0 });
    }

    const results: Array<{ id: string; success: boolean; error?: string }> = [];

    // Process each item sequentially to avoid LinkedIn rate limits
    for (const item of dueItems) {
        const meta = item.schedulingMeta as SchedulingMeta | null;

        if (!meta) {
            await markContentFailed(item.id, "No scheduling metadata found");
            results.push({ id: item.id, success: false, error: "No scheduling metadata" });
            continue;
        }

        // Skip items that have exceeded max retries
        if ((meta.retryCount || 0) >= MAX_RETRIES) {
            results.push({ id: item.id, success: false, error: "Max retries exceeded" });
            continue;
        }

        try {
            // Get access token based on postAs setting
            const isOrgPost = meta.postAs && meta.postAs !== "personal";
            let accessToken: string;
            let authorUrn: string;

            if (isOrgPost) {
                const tokenResult = await getValidOrgAccessToken(item.userId);
                if (!tokenResult) {
                    await markContentFailed(item.id, "LinkedIn organization token expired. Please reconnect.");
                    results.push({ id: item.id, success: false, error: "Org token expired" });
                    continue;
                }
                accessToken = tokenResult.accessToken;
                authorUrn = `urn:li:organization:${meta.postAs}`;
            } else {
                const tokenResult = await getValidAccessToken(item.userId);
                if (!tokenResult) {
                    await markContentFailed(item.id, "LinkedIn token expired. Please reconnect.");
                    results.push({ id: item.id, success: false, error: "Token expired" });
                    continue;
                }
                accessToken = tokenResult.accessToken;
                const rawId = tokenResult.account.providerAccountId;
                authorUrn = rawId.startsWith("urn:") ? rawId : `urn:li:person:${rawId}`;
            }

            // Build commentary from content
            let commentary = item.content || "";

            // For articles with a link attachment, use title + description as commentary
            if (item.type === "linkedin_article" && meta.articleUrl) {
                const parts = [item.title, item.description].filter(Boolean);
                commentary = parts.join("\n\n").trim() || commentary;
            }

            // Call LinkedIn API
            const result = await createPost(accessToken, {
                authorUrn,
                commentary,
                visibility: meta.visibility || "PUBLIC",
                ...(meta.articleUrl && {
                    article: {
                        source: meta.articleUrl,
                        title: meta.articleTitle,
                        description: meta.articleDescription,
                    },
                }),
            });

            if (result.success) {
                await markContentPublished(item.id, result.postId);
                console.log("[Cron] Published:", item.id, "postId:", result.postId);
                results.push({ id: item.id, success: true });
            } else {
                await markContentFailed(item.id, result.error || "LinkedIn API error");
                console.error("[Cron] Failed:", item.id, result.error);
                results.push({ id: item.id, success: false, error: result.error });
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            await markContentFailed(item.id, errorMessage);
            console.error("[Cron] Error processing:", item.id, errorMessage);
            results.push({ id: item.id, success: false, error: errorMessage });
        }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    console.log(`[Cron] Processed ${results.length} items: ${succeeded} succeeded, ${failed} failed`);

    return NextResponse.json({
        message: `Processed ${results.length} items`,
        processed: results.length,
        succeeded,
        failed,
        results,
    });
}
