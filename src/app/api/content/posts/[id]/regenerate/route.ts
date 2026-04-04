// src/app/api/content/posts/[id]/regenerate/route.ts
// Regenerate a single post with fresh research

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { getModel } from "@/lib/ai-models";
import { db } from "@/db";
import { usageLogs } from "@/db/schema";
import {
    resolveAuthor,
    fetchUserSettings,
    buildBriefContext,
    SYSTEM_PROMPTS,
} from "@/lib/services/campaign-prompts";
import {
    getContentItemById,
    updateContentItem,
} from "@/lib/services/content-items";
import { researchTopic, formatResearchContext } from "@/lib/services/tavily-research";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

interface RegenerateBody {
    theme?: string;
    authorId?: string;
    tone?: string;
    postType?: string;
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = (await request.json()) as RegenerateBody;
        const { theme, authorId, tone = "professional", postType = "insight" } = body;

        // Fetch existing post
        const post = await getContentItemById(id, session.user.id);
        if (!post) {
            return NextResponse.json({ error: "Post not found" }, { status: 404 });
        }

        // Use original prompt as the angle, or theme if provided
        const angle = theme || post.generatedFromPrompt || "Industry insight";

        // Resolve author and settings
        const settings = await fetchUserSettings(session.user.id);
        const author = resolveAuthor(authorId, session, settings);

        // Fresh research on this specific angle
        const research = await researchTopic(
            `${angle} ${settings.industry || ""} latest data trends`.trim(),
            5
        );
        const researchContext = formatResearchContext(research);

        const briefContext = buildBriefContext(
            {
                topic: angle,
                targetAudience: "",
                keyPoints: [],
                tone,
            },
            author,
            settings
        );

        const userPrompt = `Create a LinkedIn post about: ${angle}

Post type: ${postType}

${researchContext}

--- Brief Context ---
${briefContext}

The post MUST reference real data, trends, or research from the context above. Do NOT fabricate statistics, client stories, or cite fake sources. Use only the research provided or well-known industry facts.

Generate the post content only, no additional commentary.`;

        const message = await anthropic.messages.create({
            model: getModel("contentPost"),
            max_tokens: 1024,
            system: SYSTEM_PROMPTS.linkedinPost,
            messages: [{ role: "user", content: userPrompt }],
        });

        const generatedContent =
            message.content[0].type === "text"
                ? message.content[0].text
                : "";

        // Update the post in-place
        await updateContentItem(id, session.user.id, {
            content: generatedContent,
            authorName: author.name,
            authorRole: author.role,
            authorImageUrl: author.image,
        });

        // Log usage
        try {
            await db.insert(usageLogs).values({
                userId: session.user.id,
                type: "content_post_regenerate",
                agent: "contentPost",
                inputTokens: message.usage?.input_tokens || 0,
                outputTokens: message.usage?.output_tokens || 0,
                model: getModel("contentPost"),
                metadata: { postId: id, angle },
            });
        } catch (logErr) {
            console.error("[Regenerate] Failed to log usage:", logErr);
        }

        return NextResponse.json({
            success: true,
            post: {
                id,
                content: generatedContent,
                charCount: generatedContent.length,
                authorName: author.name,
                authorRole: author.role,
                authorImageUrl: author.image,
            },
        });
    } catch (error: unknown) {
        console.error("Regenerate post error:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Failed to regenerate post";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
