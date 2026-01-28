// src/app/api/content/blogs/generate/route.ts
// API route for AI-assisted web blog generation

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt for blog generation
const SYSTEM_PROMPT = `You are an expert SEO content writer. Create engaging, SEO-optimized blog posts for business websites.

Guidelines:
- Write a compelling, keyword-rich title
- Create a meta description (150-160 characters) that encourages clicks
- Start with a hook that addresses the reader's pain point or curiosity
- Use clear H2 and H3 subheadings for structure and SEO
- Include practical examples, data, and actionable advice
- Write in a conversational but professional tone
- Target 1000-2000 words for comprehensive coverage
- End with a strong conclusion and call-to-action
- Suggest internal linking opportunities as [LINK: topic description]

Format the output as follows:
---
title: "Your SEO-Optimized Title Here"
description: "Meta description under 160 characters that compels clicks"
category: "Suggested Category"
tags: ["tag1", "tag2", "tag3", "tag4", "tag5"]
---

Then write the full blog content in Markdown with proper headings.`;

interface GenerateBlogBody {
    topic: string;
    targetAudience?: string;
    keywords?: string[];
    tone?: string;
    wordCount?: string;
    articleContent?: string; // Optional: adapt from LinkedIn article
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
        const body = await request.json() as GenerateBlogBody;
        const {
            topic,
            targetAudience,
            keywords,
            tone = "professional",
            wordCount = "1500",
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
            // Generate blog from LinkedIn article
            userPrompt = `Adapt this LinkedIn article into an SEO-optimized blog post for a business website.

Original Article Title: ${articleTitle || "Untitled"}

Article Content:
${articleContent}

Requirements:
- Expand the content for better SEO coverage (target ${wordCount} words)
- Add more detailed examples and explanations
- Include H2 and H3 subheadings for better structure
- Suggest internal linking opportunities
- Create an SEO-optimized title and meta description
- Add relevant tags and suggest a category`;
        } else {
            // Generate standalone blog
            userPrompt = `Write an SEO-optimized blog post about: ${topic}

Target word count: ${wordCount} words
Tone: ${tone}`;

            if (targetAudience) {
                userPrompt += `\nTarget audience: ${targetAudience}`;
            }

            if (keywords && keywords.length > 0) {
                userPrompt += `\nTarget keywords to include naturally: ${keywords.join(", ")}`;
            }
        }

        userPrompt += `\n\nGenerate the complete blog post with frontmatter (title, description, category, tags) followed by the content.`;

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

        // Parse frontmatter
        const frontmatterMatch = generatedContent.match(/^---\n([\s\S]*?)\n---/);
        let title = topic || articleTitle || "Untitled Blog Post";
        let description = "";
        let category = "";
        let tags: string[] = [];
        let content = generatedContent;

        if (frontmatterMatch) {
            const fm = frontmatterMatch[1];
            
            const titleMatch = fm.match(/title:\s*"(.+?)"/);
            const descMatch = fm.match(/description:\s*"(.+?)"/);
            const catMatch = fm.match(/category:\s*"(.+?)"/);
            const tagsMatch = fm.match(/tags:\s*\[(.+?)\]/);
            
            if (titleMatch) title = titleMatch[1];
            if (descMatch) description = descMatch[1];
            if (catMatch) category = catMatch[1];
            if (tagsMatch) {
                tags = tagsMatch[1]
                    .split(",")
                    .map(t => t.trim().replace(/"/g, ""))
                    .filter(t => t.length > 0);
            }

            // Remove frontmatter from content
            content = generatedContent.replace(/^---\n[\s\S]*?\n---\n*/, "").trim();
        }

        // Calculate word count
        const wordCountActual = content.split(/\s+/).filter(w => w.length > 0).length;

        return NextResponse.json({
            success: true,
            generated: {
                title,
                description,
                category,
                tags,
                content,
                wordCount: wordCountActual,
                prompt: topic || `Adapted from: ${articleTitle}`,
                model: "claude-sonnet-4-20250514",
            },
        });
    } catch (error: unknown) {
        console.error("Generate blog error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to generate blog";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
