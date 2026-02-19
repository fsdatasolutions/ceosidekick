// src/app/api/content/posts/generate/route.ts
// API route for AI-assisted LinkedIn post generation

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { getModel } from "@/lib/ai-models";
import {
    resolveAuthor,
    fetchUserSettings,
    buildBriefContext,
    SYSTEM_PROMPTS,
} from "@/lib/services/campaign-prompts";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

interface GeneratePostBody {
    topic: string;
    postType?: string;
    targetAudience?: string;
    tone?: string;
    authorId?: string;
    articleContent?: string; // Optional: derive post from an article
    articleTitle?: string;
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json() as GeneratePostBody;
        const {
            topic,
            postType = "insight",
            targetAudience,
            tone = "professional",
            authorId,
            articleContent,
            articleTitle,
        } = body;

        if (!topic && !articleContent) {
            return NextResponse.json(
                { error: "Topic or article content is required" },
                { status: 400 }
            );
        }

        // Resolve author and company settings for voice context
        const settings = await fetchUserSettings(session.user.id);
        const author = resolveAuthor(authorId, session, settings);

        // Build context from brief-like data
        const briefContext = buildBriefContext(
            {
                topic: topic || `Promote article: ${articleTitle}`,
                targetAudience: targetAudience || "",
                keyPoints: [],
                tone,
            },
            author,
            settings
        );

        // Build the generation prompt
        let userPrompt = "";

        if (articleContent) {
            // Generate post from article
            userPrompt = `Create a LinkedIn post that promotes this article.

Article Title: ${articleTitle || "Untitled"}

Article Content (excerpt):
${articleContent.substring(0, 2000)}

The post should:
- Tease the key insight from the article
- Create curiosity to read more
- Include a call-to-action to read the full article
- Be engaging and shareable`;
        } else {
            // Generate standalone post
            userPrompt = `Create a LinkedIn post about: ${topic}

Post type: ${postType}`;
        }

        userPrompt += `\n\n--- Brief Context ---\n${briefContext}`;
        userPrompt += `\n\nGenerate the post content only, no additional commentary.`;

        // Generate with Claude
        const message = await anthropic.messages.create({
            model: getModel("contentPost"),
            max_tokens: 1024,
            system: SYSTEM_PROMPTS.linkedinPost,
            messages: [
                {
                    role: "user",
                    content: userPrompt,
                },
            ],
        });

        // Extract the generated content
        const generatedContent = message.content[0].type === "text"
            ? message.content[0].text
            : "";

        // Calculate character count (LinkedIn limit is 3000)
        const charCount = generatedContent.length;

        return NextResponse.json({
            success: true,
            generated: {
                content: generatedContent,
                charCount,
                isWithinLimit: charCount <= 3000,
                postType,
                prompt: topic || `From article: ${articleTitle}`,
                model: getModel("contentPost"),
                authorName: author.name,
                authorRole: author.role,
                authorImageUrl: author.image,
            },
        });
    } catch (error: unknown) {
        console.error("Generate post error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to generate post";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
