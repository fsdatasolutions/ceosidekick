// src/app/api/content/articles/generate/route.ts
// API route for AI-assisted LinkedIn article generation

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt for article generation
const SYSTEM_PROMPT = `You are an expert LinkedIn content strategist and writer. Your task is to create professional, engaging LinkedIn articles that establish thought leadership and drive engagement.

When writing LinkedIn articles:
1. Start with a compelling hook that draws readers in
2. Use clear, professional language that's accessible to a broad business audience
3. Include practical insights and actionable takeaways
4. Break up content with subheadings for easy scanning
5. End with a clear call-to-action or thought-provoking question
6. Keep paragraphs short (2-3 sentences) for mobile readability
7. Use specific examples and data when possible
8. Maintain a conversational yet professional tone

Format the article in Markdown with:
- A compelling title (H1)
- Clear section headings (H2)
- Bullet points where appropriate
- Bold text for key points

The article should be between 800-1500 words for optimal LinkedIn engagement.`;

interface GenerateRequestBody {
    topic: string;
    targetAudience?: string;
    keyPoints?: string[];
    tone?: string;
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
            includeCallToAction = true,
        } = body;

        if (!topic) {
            return NextResponse.json(
                { error: "Topic is required" },
                { status: 400 }
            );
        }

        // Build the generation prompt
        let userPrompt = `Write a LinkedIn article about: ${topic}\n\n`;

        if (targetAudience) {
            userPrompt += `Target audience: ${targetAudience}\n\n`;
        }

        if (keyPoints && keyPoints.length > 0) {
            userPrompt += `Key points to cover:\n${keyPoints.map((p) => `- ${p}`).join('\n')}\n\n`;
        }

        userPrompt += `Tone: ${tone}\n`;

        if (includeCallToAction) {
            userPrompt += `Include a call-to-action at the end.\n`;
        }

        userPrompt += `\nPlease generate the complete article in Markdown format.`;

        // Generate with Claude
        const message = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            system: SYSTEM_PROMPT,
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

        // Parse title from the content (first H1)
        const titleMatch = generatedContent.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : topic;

        // Generate a description (first paragraph or summary)
        // Using split instead of regex with /s flag for ES2017 compatibility
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
                model: "claude-sonnet-4-20250514",
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