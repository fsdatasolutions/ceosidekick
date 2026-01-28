// src/app/api/content/campaigns/[id]/regenerate/route.ts
// API route for regenerating individual content pieces in a campaign

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import {
    getCampaignSession,
    updateCampaignContent,
} from "@/lib/services/content-campaigns";
import { generateImage } from "@/lib/dalle";
import { uploadImageFromUrl } from "@/lib/gcs";
import { createContentImage } from "@/lib/services/content-images";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

interface ContentBrief {
    topic: string;
    targetAudience?: string;
    keyPoints?: string[];
    tone?: string;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const userId = session.user.id;
        const body = await request.json();

        const { contentType, customPrompt } = body as {
            contentType: 'image' | 'linkedinArticle' | 'linkedinPost' | 'webBlog';
            customPrompt?: string;
        };

        // Get campaign
        const campaign = getCampaignSession(id, userId);
        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        const brief = campaign.brief as ContentBrief;
        const briefContext = buildBriefContext(brief);
        const articleContent = campaign.generated.linkedinArticle?.content || '';

        // Mark as generating
        updateCampaignContent(id, contentType, { status: 'generating' });

        try {
            switch (contentType) {
                case 'linkedinArticle': {
                    const prompt = customPrompt || `Create a LinkedIn article based on this brief:\n\n${briefContext}`;
                    const result = await generateWithClaude(SYSTEM_PROMPTS.linkedinArticle, prompt);

                    const titleMatch = result.match(/^#\s+(.+)$/m);
                    const title = titleMatch ? titleMatch[1] : brief.topic;

                    // ES2017-compatible: Use line-by-line parsing instead of /s flag
                    const lines = result.split('\n');
                    let description = '';
                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        if (trimmedLine && !trimmedLine.startsWith('#')) {
                            description = trimmedLine.substring(0, 300);
                            break;
                        }
                    }

                    updateCampaignContent(id, 'linkedinArticle', {
                        status: 'completed',
                        title,
                        content: result,
                        description,
                    });
                    break;
                }

                case 'linkedinPost': {
                    const basePrompt = articleContent
                        ? `Create a LinkedIn post that promotes/summarizes this article:\n\n${articleContent.substring(0, 2000)}\n\nOriginal brief: ${briefContext}`
                        : `Create a LinkedIn post based on this brief:\n\n${briefContext}`;
                    const prompt = customPrompt || basePrompt;

                    const result = await generateWithClaude(SYSTEM_PROMPTS.linkedinPost, prompt);

                    updateCampaignContent(id, 'linkedinPost', {
                        status: 'completed',
                        content: result,
                    });
                    break;
                }

                case 'webBlog': {
                    const basePrompt = articleContent
                        ? `Adapt this LinkedIn article into an SEO-optimized blog post:\n\n${articleContent}\n\nOriginal brief: ${briefContext}`
                        : `Create a blog post based on this brief:\n\n${briefContext}`;
                    const prompt = customPrompt || basePrompt;

                    const result = await generateWithClaude(SYSTEM_PROMPTS.webBlog, prompt);

                    // Parse frontmatter
                    const frontmatterMatch = result.match(/^---\n([\s\S]*?)\n---/);
                    let title = brief.topic;
                    let description = '';
                    let category = '';
                    let tags: string[] = [];

                    if (frontmatterMatch) {
                        const fm = frontmatterMatch[1];
                        const fmTitleMatch = fm.match(/title:\s*"(.+?)"/);
                        const fmDescMatch = fm.match(/description:\s*"(.+?)"/);
                        const catMatch = fm.match(/category:\s*"(.+?)"/);
                        const tagsMatch = fm.match(/tags:\s*\[(.+?)\]/);

                        if (fmTitleMatch) title = fmTitleMatch[1];
                        if (fmDescMatch) description = fmDescMatch[1];
                        if (catMatch) category = catMatch[1];
                        if (tagsMatch) tags = tagsMatch[1].split(',').map(t => t.trim().replace(/"/g, ''));
                    }

                    updateCampaignContent(id, 'webBlog', {
                        status: 'completed',
                        title,
                        content: result,
                        description,
                        category,
                        tags,
                    });
                    break;
                }

                case 'image': {
                    const contextForImage = articleContent
                        ? `Article:\n${articleContent.substring(0, 1000)}\n\nBrief: ${briefContext}`
                        : briefContext;

                    const imagePrompt = customPrompt || await generateWithClaude(
                        SYSTEM_PROMPTS.imagePrompt,
                        `Create an image prompt for:\n\n${contextForImage}`
                    );

                    const imageResult = await generateImage({
                        prompt: imagePrompt,
                        model: 'dall-e-3',
                        size: '1792x1024',
                        quality: 'standard',
                        style: 'vivid',
                    });

                    const uploadResult = await uploadImageFromUrl(imageResult.imageUrl, {
                        userId,
                        fileName: `campaign-hero-${Date.now()}.png`,
                        mimeType: 'image/png',
                    });

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

                    updateCampaignContent(id, 'image', {
                        status: 'completed',
                        id: image.id,
                        url: uploadResult.gcsUrl,
                        prompt: imagePrompt,
                    });
                    break;
                }
            }

            const updatedCampaign = getCampaignSession(id, userId);
            return NextResponse.json({
                success: true,
                campaign: updatedCampaign,
            });
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            updateCampaignContent(id, contentType, {
                status: 'error',
                error: errorMessage,
            });
            throw error;
        }
    } catch (error: unknown) {
        console.error("Regenerate error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to regenerate content";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

// Helper functions
function buildBriefContext(brief: ContentBrief): string {
    let context = `Topic: ${brief.topic}\n`;
    if (brief.targetAudience) context += `Target Audience: ${brief.targetAudience}\n`;
    if (brief.keyPoints && brief.keyPoints.length > 0) {
        context += `Key Points:\n${brief.keyPoints.map((p: string) => `- ${p}`).join('\n')}\n`;
    }
    if (brief.tone) context += `Tone: ${brief.tone}\n`;
    return context;
}

async function generateWithClaude(systemPrompt: string, userPrompt: string): Promise<string> {
    const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
    });
    return message.content[0].type === "text" ? message.content[0].text : "";
}

const SYSTEM_PROMPTS = {
    linkedinArticle: `You are an expert LinkedIn content strategist. Create a professional, engaging LinkedIn article that establishes thought leadership. Format in Markdown with H1 title, H2 sections. Target 800-1500 words.`,
    linkedinPost: `You are an expert LinkedIn content strategist. Create a compelling LinkedIn post (150-300 words). Plain text with line breaks, include hashtags. Start with a hook.`,
    webBlog: `You are an expert content writer. Create an SEO-optimized blog post with frontmatter (title, description, category, tags). Target 1000-2000 words in Markdown.`,
    imagePrompt: `Create a DALL-E image prompt. Professional, business-appropriate. Include style, composition, colors. Under 400 chars. Return ONLY the prompt.`,
};