// src/app/api/linkedin/post/route.ts
// Posts content to LinkedIn on behalf of the authenticated user.
// Supports posting as personal profile or as an organization page.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getValidAccessToken, getValidOrgAccessToken, createPost } from "@/lib/linkedin";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // 1. Parse request body
        const body = await request.json();
        const {
            content,
            visibility = "PUBLIC",
            articleUrl,
            articleTitle,
            articleDescription,
            postAs,
        } = body as {
            content: string;
            visibility?: "PUBLIC" | "CONNECTIONS";
            articleUrl?: string;
            articleTitle?: string;
            articleDescription?: string;
            postAs?: string; // "personal" (default) or an org ID (e.g. "12345")
        };

        if (!content || !content.trim()) {
            return NextResponse.json(
                { error: "Post content is required" },
                { status: 400 }
            );
        }

        // 2. Determine if posting as personal or org
        const isOrgPost = postAs && postAs !== "personal";

        let accessToken: string;
        let authorUrn: string;

        if (isOrgPost) {
            // --- Organization posting ---
            const tokenResult = await getValidOrgAccessToken(userId);

            if (!tokenResult) {
                return NextResponse.json(
                    {
                        error: "LinkedIn organization connection expired. Please reconnect in Settings.",
                        reconnectRequired: true,
                    },
                    { status: 401 }
                );
            }

            accessToken = tokenResult.accessToken;
            authorUrn = `urn:li:organization:${postAs}`;
            console.log("[LinkedIn Post] Posting as organization:", postAs);
        } else {
            // --- Personal profile posting ---
            const tokenResult = await getValidAccessToken(userId);

            if (!tokenResult) {
                return NextResponse.json(
                    {
                        error: "LinkedIn connection expired. Please reconnect your account.",
                        reconnectRequired: true,
                    },
                    { status: 401 }
                );
            }

            accessToken = tokenResult.accessToken;

            // The providerAccountId may be a raw sub (e.g. "lFKYWEWC1n") or a full URN
            const rawId = tokenResult.account.providerAccountId;
            if (!rawId) {
                return NextResponse.json(
                    { error: "LinkedIn profile not found. Please reconnect your account.", reconnectRequired: true },
                    { status: 400 }
                );
            }
            authorUrn = rawId.startsWith("urn:") ? rawId : `urn:li:person:${rawId}`;
            console.log("[LinkedIn Post] Posting as personal profile for user:", userId);
        }

        // 3. Post to LinkedIn
        const result = await createPost(accessToken, {
            authorUrn,
            commentary: content,
            visibility,
            ...(articleUrl && {
                article: {
                    source: articleUrl,
                    title: articleTitle,
                    description: articleDescription,
                },
            }),
        });

        if (!result.success) {
            console.error("[LinkedIn Post] Failed:", result.error);
            return NextResponse.json(
                { error: result.error || "Failed to post to LinkedIn" },
                { status: 500 }
            );
        }

        console.log("[LinkedIn Post] Successfully posted, postId:", result.postId);

        return NextResponse.json({
            success: true,
            postId: result.postId,
            message: "Successfully posted to LinkedIn",
        });
    } catch (error) {
        console.error("[LinkedIn Post] Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to post to LinkedIn";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
