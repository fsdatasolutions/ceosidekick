// src/app/api/content/posts/bulk-generate/route.ts
// Bulk LinkedIn post generation with Tavily web research

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
    CONTENT_CREDITS,
} from "@/lib/services/campaign-prompts";
import { createContentItem } from "@/lib/services/content-items";
import { checkCreditsAmount, deductCredits } from "@/lib/services/usage";
import { researchTopic, formatResearchContext } from "@/lib/services/tavily-research";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

interface BulkGenerateBody {
    count: number;
    theme?: string;
    authorId?: string;
    targetAudience?: string;
    tone?: string;
    postType?: string;
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = (await request.json()) as BulkGenerateBody;
        const {
            count,
            theme,
            authorId,
            targetAudience,
            tone = "professional",
            postType = "insight",
        } = body;

        // Validate count
        if (!count || count < 1 || count > 20) {
            return NextResponse.json(
                { error: "Count must be between 1 and 20" },
                { status: 400 }
            );
        }

        // Check credits
        const totalCredits = count * CONTENT_CREDITS.linkedinPost;
        const hasCredits = await checkCreditsAmount(session.user.id, totalCredits);
        if (!hasCredits) {
            return NextResponse.json(
                { error: `Insufficient credits. Need ${totalCredits} credits for ${count} posts.` },
                { status: 403 }
            );
        }

        // Resolve author and settings
        const settings = await fetchUserSettings(session.user.id);
        const author = resolveAuthor(authorId, session, settings);

        // Step 1: Research the theme with Tavily
        const searchQuery = theme
            ? `${theme} ${settings.industry || ""} latest trends data statistics 2024 2025 2026`.trim()
            : `${settings.industry || "business"} leadership thought leadership trends insights 2024 2025 2026`;

        const research = await researchTopic(searchQuery, Math.min(count + 3, 10));
        const researchContext = formatResearchContext(research);

        // Step 2: Generate content plan (unique angles for each post)
        const briefContext = buildBriefContext(
            {
                topic: theme || "Industry thought leadership",
                targetAudience: targetAudience || "",
                keyPoints: [],
                tone,
            },
            author,
            settings
        );

        const planPrompt = `You are planning a series of ${count} LinkedIn posts${theme ? ` around the theme: "${theme}"` : ""}.

${researchContext}

${briefContext}

Generate exactly ${count} unique post angles/topics. Each should be distinct and based on real trends, data, or insights from the research above.

Return ONLY a JSON array of strings, each being a specific post angle. Example:
["Post angle 1 about specific trend", "Post angle 2 about specific data point"]

Do NOT include any other text, just the JSON array.`;

        const planMessage = await anthropic.messages.create({
            model: getModel("contentPost"),
            max_tokens: 1024,
            messages: [{ role: "user", content: planPrompt }],
        });

        const planText =
            planMessage.content[0].type === "text"
                ? planMessage.content[0].text
                : "[]";

        let angles: string[];
        try {
            // Extract JSON array from response (handle potential markdown wrapping)
            const jsonMatch = planText.match(/\[[\s\S]*\]/);
            angles = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        } catch {
            // Fallback: split by newlines if JSON parsing fails
            angles = planText
                .split("\n")
                .filter((line) => line.trim().length > 10)
                .slice(0, count);
        }

        // Ensure we have exactly `count` angles
        while (angles.length < count) {
            angles.push(
                theme
                    ? `${theme} - perspective ${angles.length + 1}`
                    : `Industry insight #${angles.length + 1}`
            );
        }
        angles = angles.slice(0, count);

        // Step 3: Generate each post with research context
        const posts: Array<{
            id: string;
            content: string;
            angle: string;
            charCount: number;
            authorName: string;
            authorRole: string;
            authorImageUrl: string;
        }> = [];

        let totalInputTokens = 0;
        let totalOutputTokens = 0;

        for (let i = 0; i < angles.length; i++) {
            const angle = angles[i];

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

            totalInputTokens += message.usage?.input_tokens || 0;
            totalOutputTokens += message.usage?.output_tokens || 0;

            // Save as draft content item
            const item = await createContentItem({
                userId: session.user.id,
                type: "linkedin_post",
                content: generatedContent,
                linkedinPostType: postType,
                authorName: author.name,
                authorRole: author.role,
                authorImageUrl: author.image,
                generatedFromPrompt: angle,
                aiModel: getModel("contentPost"),
            });

            posts.push({
                id: item.id,
                content: generatedContent,
                angle,
                charCount: generatedContent.length,
                authorName: author.name,
                authorRole: author.role,
                authorImageUrl: author.image,
            });
        }

        // Deduct credits
        await deductCredits(session.user.id, totalCredits, {
            type: "bulk_content_posts",
            agent: "contentPost",
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            model: getModel("contentPost"),
            metadata: {
                count,
                theme: theme || null,
                authorId: authorId || "self",
            },
        });

        // Log usage
        try {
            await db.insert(usageLogs).values({
                userId: session.user.id,
                type: "bulk_content_posts",
                agent: "contentPost",
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
                model: getModel("contentPost"),
                metadata: { count, theme, postType },
            });
        } catch (logErr) {
            console.error("[Bulk Generate] Failed to log usage:", logErr);
        }

        return NextResponse.json({
            success: true,
            posts,
            creditsCharged: totalCredits,
        });
    } catch (error: unknown) {
        console.error("Bulk generate error:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Failed to generate posts";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
