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
import { uploadImageFromUrl, refreshSignedUrl } from "@/lib/gcs";
import { createContentImage } from "@/lib/services/content-images";
import { logErrorToFeedback } from "@/lib/services/error-logger";
import {
    SYSTEM_PROMPTS,
    buildBriefContext,
    resolveAuthor,
    fetchUserSettings,
    calculateCampaignCredits,
    CONTENT_CREDITS,
} from "@/lib/services/campaign-prompts";
import { checkCreditAllowance, incrementCreditUsage } from "@/lib/usage";
import { calculateCreditCost } from "@/lib/credits";
import { getModel } from "@/lib/ai-models";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

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

        // ============================================
        // PAYWALL: Pre-check estimated credits before generation
        // Actual cost is token-scaled and deducted after generation
        // ============================================
        const estimatedCredits = calculateCampaignCredits(outputs);
        console.log("[Campaign Generate] Estimated credits:", estimatedCredits);

        const usageCheck = await checkCreditAllowance(userId, estimatedCredits);

        if (!usageCheck.allowed) {
            console.log("[Campaign Generate] User hit credit limit:", userId, "needed:", estimatedCredits, "remaining:", usageCheck.usage.remaining);
            return NextResponse.json(
                {
                    error: `This campaign requires approximately ${estimatedCredits} credits, but you have ${usageCheck.usage.remaining} remaining. Upgrade your plan or purchase a credit pack to continue.`,
                    usage: usageCheck.usage,
                    creditsRequired: estimatedCredits,
                },
                { status: 403 }
            );
        }

        // Resolve author and company settings
        const settings = await fetchUserSettings(userId);
        const author = resolveAuthor(brief.authorId, session, settings);
        console.log("[Campaign Generate] Author:", author.name, "| Role:", author.role);

        // Create campaign session
        const campaign = createCampaignSession(userId, brief, outputs);
        console.log("[Campaign Generate] Campaign session created:", campaign.id);

        updateCampaignStatus(campaign.id, 'generating');

        // Build the brief context for AI (now includes author + company context)
        const briefContext = buildBriefContext(brief, author, settings);
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

                console.log("[Campaign Generate] Article generated, length:", result.text.length);

                const titleMatch = result.text.match(/^#\s+(.+)$/m);
                const title = titleMatch ? titleMatch[1] : brief.topic;

                // Fixed: Use split instead of regex with /s flag
                const lines = result.text.split('\n');
                let description = '';
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine && !trimmedLine.startsWith('#')) {
                        description = trimmedLine.substring(0, 300);
                        break;
                    }
                }

                articleContent = result.text;

                updateCampaignContent(campaign.id, 'linkedinArticle', {
                    status: 'completed',
                    title,
                    content: result.text,
                    description,
                    creditCost: calculateCreditCost(result.inputTokens, result.outputTokens),
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

                    console.log("[Campaign Generate] Post generated, length:", result.text.length);

                    updateCampaignContent(campaign.id, 'linkedinPost', {
                        status: 'completed',
                        content: result.text,
                        creditCost: calculateCreditCost(result.inputTokens, result.outputTokens),
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

                    console.log("[Campaign Generate] Blog generated, length:", result.text.length);

                    // Parse frontmatter
                    const frontmatterMatch = result.text.match(/^---\n([\s\S]*?)\n---/);
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
                        content: result.text,
                        description,
                        category,
                        tags,
                        creditCost: calculateCreditCost(result.inputTokens, result.outputTokens),
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
                    const imagePromptResult = await generateWithClaude(
                        SYSTEM_PROMPTS.imagePrompt,
                        `Create an image prompt for:\n\n${contextForImage}`
                    );
                    const imagePrompt = imagePromptResult.text;

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

                    // Upload to GCS (non-fatal — image was already generated)
                    let uploadResult: any = null;
                    let savedImage: any = null;
                    let finalImageUrl: string = imageResult.imageUrl; // Fallback to DALL-E's temporary URL

                    try {
                        console.log("[Campaign Generate] Uploading to GCS...");
                        uploadResult = await uploadImageFromUrl(imageResult.imageUrl, {
                            userId,
                            fileName: `campaign-hero-${Date.now()}.png`,
                            mimeType: 'image/png',
                        });
                        console.log("[Campaign Generate] Uploaded to GCS:", uploadResult.gcsPath);
                    } catch (gcsError: unknown) {
                        const gcsMsg = gcsError instanceof Error ? gcsError.message : 'Unknown GCS error';
                        console.error("[Campaign Generate] GCS upload error (non-fatal):", gcsMsg, gcsError);
                        logErrorToFeedback({
                            userId,
                            source: "campaign-generate-image-gcs",
                            error: gcsError,
                            metadata: { campaignId: campaign.id, imagePrompt },
                        });
                    }

                    // Save to database (only if GCS upload succeeded)
                    if (uploadResult) {
                        try {
                            console.log("[Campaign Generate] Saving image to database...");
                            savedImage = await createContentImage({
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
                            console.log("[Campaign Generate] Image saved to database:", savedImage.id);
                        } catch (dbError: unknown) {
                            const dbMsg = dbError instanceof Error ? dbError.message : 'Unknown DB error';
                            console.error("[Campaign Generate] DB insert error (non-fatal):", dbMsg, dbError);
                            logErrorToFeedback({
                                userId,
                                source: "campaign-generate-image-db",
                                error: dbError,
                                metadata: { campaignId: campaign.id, gcsPath: uploadResult.gcsPath },
                            });
                        }

                        // Generate a fresh signed URL
                        try {
                            finalImageUrl = await refreshSignedUrl(uploadResult.gcsPath, 1);
                        } catch {
                            finalImageUrl = uploadResult.gcsUrl;
                        }
                    }

                    updateCampaignContent(campaign.id, 'image', {
                        status: 'completed',
                        id: savedImage?.id || null,
                        url: finalImageUrl,
                        prompt: imagePrompt,
                        ...((!uploadResult || !savedImage) && {
                            warning: "Image was generated but could not be fully saved. The URL may be temporary.",
                        }),
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

        // ============================================
        // PAYWALL: Deduct token-scaled credits for text + fixed for images
        // ============================================
        let creditsCharged = 0;
        const generated = finalCampaign.generated;

        // Text content: use actual token counts (token-scaled)
        if (generated.linkedinArticle?.status === 'completed') {
            creditsCharged += generated.linkedinArticle.creditCost || CONTENT_CREDITS.linkedinArticle;
        }
        if (generated.linkedinPost?.status === 'completed') {
            creditsCharged += generated.linkedinPost.creditCost || CONTENT_CREDITS.linkedinPost;
        }
        if (generated.webBlog?.status === 'completed') {
            creditsCharged += generated.webBlog.creditCost || CONTENT_CREDITS.webBlog;
        }
        // Image: fixed credits (DALL-E doesn't expose tokens)
        if (generated.image?.status === 'completed') {
            creditsCharged += CONTENT_CREDITS.image;
        }

        let updatedUsage = usageCheck.usage;
        if (creditsCharged > 0) {
            updatedUsage = await incrementCreditUsage(userId, creditsCharged);
            console.log("[Campaign Generate] Credits charged:", creditsCharged, "| Used:", updatedUsage.creditsUsed, "/", updatedUsage.totalAvailable);

            // Log to usageLogs for API cost tracking
            try {
                const { db: logDb } = await import("@/db");
                const { usageLogs } = await import("@/db/schema");
                // Estimate tokens from credits (3000 tokens/credit) since individual token counts are spread across multiple calls
                const estimatedTokens = creditsCharged * 3000;
                await logDb.insert(usageLogs).values({
                    userId,
                    type: "content_campaign",
                    agent: "contentCampaign",
                    inputTokens: 0,
                    outputTokens: estimatedTokens,
                    model: getModel("contentCampaign"),
                    metadata: { creditsCharged, campaignId: campaign.id },
                });
            } catch (logErr) {
                console.error("[Campaign Generate] Failed to log usage:", logErr);
            }
        }

        return NextResponse.json({
            success: true,
            campaign: finalCampaign,
            creditsCharged,
            usage: updatedUsage,
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

interface ClaudeResult {
    text: string;
    inputTokens: number;
    outputTokens: number;
}

async function generateWithClaude(systemPrompt: string, userPrompt: string): Promise<ClaudeResult> {
    console.log("[generateWithClaude] Calling Claude API...");
    console.log("[generateWithClaude] System prompt length:", systemPrompt.length);
    console.log("[generateWithClaude] User prompt length:", userPrompt.length);

    try {
        const message = await anthropic.messages.create({
            model: getModel("contentCampaign"),
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
        });

        const text = message.content[0].type === "text" ? message.content[0].text : "";
        const inputTokens = message.usage?.input_tokens || 0;
        const outputTokens = message.usage?.output_tokens || 0;

        console.log("[generateWithClaude] Response received, length:", text.length, "tokens:", inputTokens, "+", outputTokens);

        return { text, inputTokens, outputTokens };
    } catch (error) {
        console.error("[generateWithClaude] Claude API error:", error);
        throw error;
    }
}
