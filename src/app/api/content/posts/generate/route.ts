// src/app/api/content/posts/generate/route.ts
// API route for AI-assisted LinkedIn post generation

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt for post generation
const SYSTEM_PROMPT = `You are an expert LinkedIn content strategist. Create compelling LinkedIn posts that drive engagement.

Guidelines:
- Start with a powerful hook in the first line (this appears in the preview)
- Keep it concise but valuable (150-300 words is ideal)
- Use line breaks for readability (LinkedIn doesn't support markdown)
- Include a clear call-to-action
- End with a question to encourage comments
- Add 3-5 relevant hashtags at the end
- Use emojis sparingly and professionally (1-3 max)

Post types you can create:
- Story: Personal experience with a lesson
- Insight: Industry observation or trend
- Tips: Actionable advice list
- Question: Thought-provoking engagement post
- Celebration: Achievement or milestone
- Behind-the-scenes: Authentic peek into work

Do NOT use markdown formatting - LinkedIn posts are plain text with line breaks only.
Do NOT use bullet points with dashes - use line breaks or emojis instead.`;

interface GeneratePostBody {
    topic: string;
    postType?: string;
    targetAudience?: string;
    tone?: string;
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
            articleContent,
            articleTitle,
        } = body;

        if (!topic && !articleContent) {
            return NextResponse.json(
                { error: "Topic or article content is required" },
                { status: 400 }
            );
        }

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

Post type: ${postType}
Tone: ${tone}`;

            if (targetAudience) {
                userPrompt += `\nTarget audience: ${targetAudience}`;
            }
        }

        userPrompt += `\n\nGenerate the post content only, no additional commentary.`;

        // Generate with Claude
        const message = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 1024,
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
                model: "claude-sonnet-4-20250514",
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
