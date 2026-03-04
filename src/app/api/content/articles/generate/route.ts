// src/app/api/content/articles/generate/route.ts
// API route for AI-assisted LinkedIn article generation

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

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

interface GenerateRequestBody {
    topic: string;
    targetAudience?: string;
    keyPoints?: string[];
    tone?: string;
    authorId?: string;
    includeCallToAction?: boolean;
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
        const body = await request.json() as GenerateRequestBody;
        const {
            topic,
            targetAudience,
            keyPoints,
            tone = "professional",
            authorId,
            includeCallToAction = true,
        } = body;

        if (!topic) {
            return NextResponse.json(
                { error: "Topic is required" },
                { status: 400 }
            );
        }

        // Resolve author and company settings for voice context
        const settings = await fetchUserSettings(session.user.id);
        const author = resolveAuthor(authorId, session, settings);

        // Build context from brief-like data
        const briefContext = buildBriefContext(
            {
                topic,
                targetAudience: targetAudience || "",
                keyPoints: keyPoints || [],
                tone,
            },
            author,
            settings
        );

        // Build the generation prompt
        let userPrompt = `Write a LinkedIn article about: ${topic}\n\n`;

        if (includeCallToAction) {
            userPrompt += `Include a call-to-action at the end.\n`;
        }

        userPrompt += `\n--- Brief Context ---\n${briefContext}`;
        userPrompt += `\n\nPlease generate the complete article in Markdown format.`;

        // Generate with Claude
        const message = await anthropic.messages.create({
            model: getModel("contentArticle"),
            max_tokens: 4096,
            system: SYSTEM_PROMPTS.linkedinArticle,
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

        // Log token usage for cost tracking
        const inputTokens = message.usage?.input_tokens || 0;
        const outputTokens = message.usage?.output_tokens || 0;
        try {
            await db.insert(usageLogs).values({
                userId: session.user.id,
                type: "content_article",
                agent: "contentArticle",
                inputTokens,
                outputTokens,
                model: getModel("contentArticle"),
                metadata: { topic },
            });
        } catch (logErr) {
            console.error("[Articles Generate] Failed to log usage:", logErr);
        }

        // Parse title from the content (first H1)
        const titleMatch = generatedContent.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : topic;

        // Generate a description (first paragraph or summary)
        const lines = generatedContent.split('\n');
        let description = `An article about ${topic}`;

        for (const line of lines) {
            const trimmedLine = line.trim();
            // Find first non-empty line that's not a heading
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                description = trimmedLine.substring(0, 300);
                break;
            }
        }

        return NextResponse.json({
            success: true,
            generated: {
                title,
                content: generatedContent,
                description,
                prompt: topic,
                model: getModel("contentArticle"),
                authorName: author.name,
                authorRole: author.role,
                authorImageUrl: author.image,
            },
        });
    } catch (error: unknown) {
        console.error("Generate article error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to generate article";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
