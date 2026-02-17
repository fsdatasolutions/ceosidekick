// src/app/api/linkedin/post/route.ts
// Posts content to LinkedIn on behalf of the authenticated user.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getValidAccessToken, createPost, parseProfileFromIdToken } from "@/lib/linkedin";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // 1. Parse request body
        const body = await request.json();
        const { content, visibility = "PUBLIC" } = body as {
            content: string;
            visibility?: "PUBLIC" | "CONNECTIONS";
        };

        if (!content || !content.trim()) {
            return NextResponse.json(
                { error: "Post content is required" },
                { status: 400 }
            );
        }

        // 2. Get a valid access token (auto-refreshes if expired)
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

        const { accessToken, account } = tokenResult;

        // 3. Get the author URN from the stored account
        // The providerAccountId may be a raw sub (e.g. "lFKYWEWC1n") or a full URN
        const rawId = account.providerAccountId;
        if (!rawId) {
            return NextResponse.json(
                { error: "LinkedIn profile not found. Please reconnect your account.", reconnectRequired: true },
                { status: 400 }
            );
        }
        const authorUrn = rawId.startsWith("urn:") ? rawId : `urn:li:person:${rawId}`;

        // 4. Post to LinkedIn
        console.log("[LinkedIn Post] Posting to LinkedIn for user:", userId);
        const result = await createPost(accessToken, {
            authorUrn,
            commentary: content,
            visibility,
        });

        if (!result.success) {
            console.error("[LinkedIn Post] Failed:", result.error);
            return NextResponse.json(
                { error: result.error || "Failed to post to LinkedIn" },
                { status: 500 }
            );
        }

        const profile = parseProfileFromIdToken(account.idToken);
        console.log("[LinkedIn Post] Successfully posted for:", profile?.name || userId);

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
