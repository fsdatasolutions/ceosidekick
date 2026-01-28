// src/app/api/content/campaigns/generate/route.ts
// API route for generating all campaign content

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import {
    createCampaignSession,
    updateCampaignContent,
    updateCampaignStatus,
    getCampaignSession,
    type ContentBrief,
    type CampaignOutputs,
} from "@/lib/services/content-campaigns";
import { generateImage } from "@/lib/dalle";
import { uploadImageFromUrl } from "@/lib/gcs";
import { createContentImage } from "@/lib/services/content-images";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompts for different content types
const SYSTEM_PROMPTS = {
    linkedinArticle: `You are an expert LinkedIn content strategist. Create a professional, engaging LinkedIn article that establishes thought leadership.

Guidelines:
- Start with a compelling hook
- Use clear, accessible language
- Include practical insights and actionable takeaways
- Break content with subheadings for scanning
- End with a call-to-action or thought-provoking question
- Keep paragraphs short (2-3 sentences)
- Target 800-1500 words

Format in Markdown with H1 title, H2 sections, bullet points where appropriate, and bold for key points.`,

    linkedinPost: `You are an expert LinkedIn content strategist. Create a compelling LinkedIn post that drives engagement.

Guidelines:
- Start with a hook in the first line (this shows in preview)
- Keep it concise but valuable (150-300 words ideal)
- Use line breaks for readability
- Include a clear call-to-action
- End with a question to encourage comments
- Use 3-5 relevant hashtags at the end

Do NOT use markdown formatting - LinkedIn posts are plain text with line breaks.`,

    webBlog: `You are an expert content writer. Create an SEO-optimized blog post for a business website.

Guidelines:
- Compelling, keyword-rich title
- Meta description (150-160 characters)
- Clear introduction with the main value proposition
- Structured with H2 and H3 subheadings
- Include practical examples and data
- Internal linking opportunities noted as [LINK: topic]
- Strong conclusion with next steps
- Target 1000-2000 words

Format in Markdown. Start with frontmatter:
---
title: "Your Title"
description: "Meta description"
category: "Category"
tags: ["tag1", "tag2"]
---`,

    imagePrompt: `You are an expert at creating DALL-E image prompts. Based on the content brief, create a professional, visually appealing image prompt.

Guidelines:
- Describe a professional, business-appropriate image
- Include style details (modern, clean, corporate, etc.)
- Specify composition and color palette
- Avoid text in images (DALL-E struggles with text)
- Keep prompt under 400 characters

Return ONLY the image prompt, nothing else.`,
};

export async function POST(request: NextRequest) {
    console.log("[Campaign Generate] Starting campaign generation...");

    try {
        const session = await auth();
        if (!session?.user?.id) {
            console.log("[Campaign Generate] Unauthorized - no session");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        console.log("[Campaign Generate] User ID:", userId);

        const body = await request.json();
        console.log("[Campaign Generate] Request body:", JSON.stringify(body, null, 2));

        const { brief, outputs } = body as {
            brief: ContentBrief;
            outputs: CampaignOutputs;
        };

        // Validate
        if (!brief?.topic) {
            console.log("[Campaign Generate] Error: Topic is required");
            return NextResponse.json({ error: "Topic is required" }, { status: 400 });
        }

        const hasOutput = outputs.generateImage ||
            outputs.generateLinkedinArticle ||
            outputs.generateLinkedinPost ||
            outputs.generateWebBlog;

        if (!hasOutput) {
            console.log("[Campaign Generate] Error: No outputs selected");
            return NextResponse.json({ error: "Select at least one output type" }, { status: 400 });
        }

        console.log("[Campaign Generate] Outputs requested:", {
            image: outputs.generateImage,
            article: outputs.generateLinkedinArticle,
            post: outputs.generateLinkedinPost,
            blog: outputs.generateWebBlog,
        });

        // Create campaign session
        const campaign = createCampaignSession(userId, brief, outputs);
        console.log("[Campaign Generate] Campaign session created:", campaign.id);

        updateCampaignStatus(campaign.id, 'generating');

        // Build the brief context for AI
        const briefContext = buildBriefContext(brief);
        console.log("[Campaign Generate] Brief context:", briefContext);

        // Generate content in parallel (but image depends on article for context)
        const generatePromises: Promise<void>[] = [];

        // First, generate article if needed (other content derives from it)
        let articleContent = '';
        if (outputs.generateLinkedinArticle) {
            console.log("[Campaign Generate] Starting LinkedIn Article generation...");
            try {
                updateCampaignContent(campaign.id, 'linkedinArticle', { status: 'generating' });

                const result = await generateWithClaude(
                    SYSTEM_PROMPTS.linkedinArticle,
                    `Create a LinkedIn article based on this brief:\n\n${briefContext}`
                );

                console.log("[Campaign Generate] Article generated, length:", result.length);

                const titleMatch = result.match(/^#\s+(.+)$/m);
                const title = titleMatch ? titleMatch[1] : brief.topic;

                // Fixed: Use split instead of regex with /s flag
                const lines = result.split('\n');
                let description = '';
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine && !trimmedLine.startsWith('#')) {
                        description = trimmedLine.substring(0, 300);
                        break;
                    }
                }

                articleContent = result;

                updateCampaignContent(campaign.id, 'linkedinArticle', {
                    status: 'completed',
                    title,
                    content: result,
                    description,
                });

                console.log("[Campaign Generate] Article saved to campaign. Title:", title);
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error("[Campaign Generate] Article generation error:", errorMessage, error);
                updateCampaignContent(campaign.id, 'linkedinArticle', {
                    status: 'error',
                    error: errorMessage,
                });
            }
        }

        // Generate other content types in parallel
        if (outputs.generateLinkedinPost) {
            console.log("[Campaign Generate] Queueing LinkedIn Post generation...");
            generatePromises.push((async () => {
                console.log("[Campaign Generate] Starting LinkedIn Post generation...");
                try {
                    updateCampaignContent(campaign.id, 'linkedinPost', { status: 'generating' });

                    const prompt = articleContent
                        ? `Create a LinkedIn post that promotes/summarizes this article:\n\n${articleContent.substring(0, 2000)}\n\nOriginal brief: ${briefContext}`
                        : `Create a LinkedIn post based on this brief:\n\n${briefContext}`;

                    console.log("[Campaign Generate] Post prompt length:", prompt.length);

                    const result = await generateWithClaude(SYSTEM_PROMPTS.linkedinPost, prompt);

                    console.log("[Campaign Generate] Post generated, length:", result.length);

                    updateCampaignContent(campaign.id, 'linkedinPost', {
                        status: 'completed',
                        content: result,
                    });

                    console.log("[Campaign Generate] Post saved to campaign");
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.error("[Campaign Generate] Post generation error:", errorMessage, error);
                    updateCampaignContent(campaign.id, 'linkedinPost', {
                        status: 'error',
                        error: errorMessage,
                    });
                }
            })());
        }

        if (outputs.generateWebBlog) {
            console.log("[Campaign Generate] Queueing Web Blog generation...");
            generatePromises.push((async () => {
                console.log("[Campaign Generate] Starting Web Blog generation...");
                try {
                    updateCampaignContent(campaign.id, 'webBlog', { status: 'generating' });

                    const prompt = articleContent
                        ? `Adapt this LinkedIn article into an SEO-optimized blog post:\n\n${articleContent}\n\nOriginal brief: ${briefContext}`
                        : `Create a blog post based on this brief:\n\n${briefContext}`;

                    const result = await generateWithClaude(SYSTEM_PROMPTS.webBlog, prompt);

                    console.log("[Campaign Generate] Blog generated, length:", result.length);

                    // Parse frontmatter
                    const frontmatterMatch = result.match(/^---\n([\s\S]*?)\n---/);
                    let title = brief.topic;
                    let description = '';
                    let category = '';
                    let tags: string[] = [];

                    if (frontmatterMatch) {
                        const fm = frontmatterMatch[1];
                        const titleMatch = fm.match(/title:\s*"(.+?)"/);
                        const descMatch = fm.match(/description:\s*"(.+?)"/);
                        const catMatch = fm.match(/category:\s*"(.+?)"/);
                        const tagsMatch = fm.match(/tags:\s*\[(.+?)\]/);

                        if (titleMatch) title = titleMatch[1];
                        if (descMatch) description = descMatch[1];
                        if (catMatch) category = catMatch[1];
                        if (tagsMatch) tags = tagsMatch[1].split(',').map(t => t.trim().replace(/"/g, ''));
                    }

                    updateCampaignContent(campaign.id, 'webBlog', {
                        status: 'completed',
                        title,
                        content: result,
                        description,
                        category,
                        tags,
                    });

                    console.log("[Campaign Generate] Blog saved to campaign. Title:", title);
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.error("[Campaign Generate] Blog generation error:", errorMessage, error);
                    updateCampaignContent(campaign.id, 'webBlog', {
                        status: 'error',
                        error: errorMessage,
                    });
                }
            })());
        }

        if (outputs.generateImage) {
            console.log("[Campaign Generate] Queueing Image generation...");
            generatePromises.push((async () => {
                console.log("[Campaign Generate] Starting Image generation...");
                try {
                    updateCampaignContent(campaign.id, 'image', { status: 'generating' });

                    // Generate image prompt based on brief/article
                    const contextForImage = articleContent
                        ? `Article title and content:\n${articleContent.substring(0, 1000)}\n\nBrief: ${briefContext}`
                        : briefContext;

                    console.log("[Campaign Generate] Generating image prompt...");
                    const imagePrompt = await generateWithClaude(
                        SYSTEM_PROMPTS.imagePrompt,
                        `Create an image prompt for:\n\n${contextForImage}`
                    );

                    console.log("[Campaign Generate] Image prompt:", imagePrompt);

                    // Generate image with DALL-E
                    console.log("[Campaign Generate] Calling DALL-E...");
                    const imageResult = await generateImage({
                        prompt: imagePrompt,
                        model: 'dall-e-3',
                        size: '1792x1024', // Landscape for hero images
                        quality: 'standard',
                        style: 'vivid',
                    });

                    console.log("[Campaign Generate] DALL-E returned image URL");

                    // Upload to GCS
                    console.log("[Campaign Generate] Uploading to GCS...");
                    const uploadResult = await uploadImageFromUrl(imageResult.imageUrl, {
                        userId,
                        fileName: `campaign-hero-${Date.now()}.png`,
                        mimeType: 'image/png',
                    });

                    console.log("[Campaign Generate] Uploaded to GCS:", uploadResult.gcsPath);

                    // Save to database
                    console.log("[Campaign Generate] Saving image to database...");
                    const image = await createContentImage({
                        userId,
                        name: `Hero: ${brief.topic.substring(0, 50)}`,
                        originalName: `campaign-hero.png`,
                        gcsUrl: uploadResult.gcsUrl,
                        gcsBucket: uploadResult.gcsBucket,
                        gcsPath: uploadResult.gcsPath,
                        mimeType: 'image/png',
                        size: uploadResult.size,
                        width: 1792,
                        height: 1024,
                        source: 'dalle',
                        generatedFromPrompt: imagePrompt,
                        aiModel: 'dall-e-3',
                    });

                    console.log("[Campaign Generate] Image saved to database:", image.id);

                    updateCampaignContent(campaign.id, 'image', {
                        status: 'completed',
                        id: image.id,
                        url: uploadResult.gcsUrl,
                        prompt: imagePrompt,
                    });

                    console.log("[Campaign Generate] Image saved to campaign");
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.error("[Campaign Generate] Image generation error:", errorMessage, error);
                    updateCampaignContent(campaign.id, 'image', {
                        status: 'error',
                        error: errorMessage,
                    });
                }
            })());
        }

        // Wait for all parallel generations
        console.log("[Campaign Generate] Waiting for", generatePromises.length, "parallel generations...");
        await Promise.all(generatePromises);
        console.log("[Campaign Generate] All generations complete");

        // Get final campaign state
        const finalCampaign = getCampaignSession(campaign.id, userId);
        console.log("[Campaign Generate] Final campaign state:", JSON.stringify(finalCampaign, null, 2));

        if (!finalCampaign) {
            console.error("[Campaign Generate] Error: Campaign session not found after generation!");
            return NextResponse.json(
                { error: "Campaign session lost during generation" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            campaign: finalCampaign,
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to generate campaign";
        console.error("[Campaign Generate] Fatal error:", errorMessage, error);
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

function buildBriefContext(brief: ContentBrief): string {
    let context = `Topic: ${brief.topic}\n`;

    if (brief.targetAudience) {
        context += `Target Audience: ${brief.targetAudience}\n`;
    }

    if (brief.keyPoints && brief.keyPoints.length > 0) {
        context += `Key Points:\n${brief.keyPoints.map(p => `- ${p}`).join('\n')}\n`;
    }

    if (brief.tone) {
        context += `Tone: ${brief.tone}\n`;
    }

    return context;
}

async function generateWithClaude(systemPrompt: string, userPrompt: string): Promise<string> {
    console.log("[generateWithClaude] Calling Claude API...");
    console.log("[generateWithClaude] System prompt length:", systemPrompt.length);
    console.log("[generateWithClaude] User prompt length:", userPrompt.length);

    try {
        const message = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
        });

        const result = message.content[0].type === "text" ? message.content[0].text : "";
        console.log("[generateWithClaude] Response received, length:", result.length);

        return result;
    } catch (error) {
        console.error("[generateWithClaude] Claude API error:", error);
        throw error;
    }
}