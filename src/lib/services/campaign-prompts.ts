// src/lib/services/campaign-prompts.ts
// Shared utilities for campaign content generation
// Extracted from generate/route.ts and regenerate/route.ts to eliminate duplication

import path from "path";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAuthor, type BlogAuthor } from "@/lib/blog-authors";
import type { ContentBrief } from "@/lib/services/content-campaigns";
import type { CampaignOutputs } from "@/lib/services/content-campaigns";

// ============================================
// CONTENT CREDIT COSTS
// ============================================

/**
 * Credits charged per content type.
 * These are fixed estimates used as pre-checks before generation.
 * Actual credit cost for text content is token-scaled (1 credit = 3,000 tokens).
 * Image credits remain fixed since DALL-E doesn't expose tokens.
 *
 * Rationale:
 *   - LinkedIn Post (1): short-form, single Claude call
 *   - LinkedIn Article (3): long-form, ~1500 words
 *   - Web Blog (3): long-form + frontmatter parsing
 *   - Hero Image (3): Claude call for prompt + DALL-E 3 landscape generation
 *     (matches GENERATION_CREDITS for dall-e-3 1792×1024 standard)
 */
export const CONTENT_CREDITS: Record<string, number> = {
    linkedinPost: 1,
    linkedinArticle: 3,
    webBlog: 3,
    image: 3,
};

/**
 * Calculate total credits required for a set of campaign outputs.
 */
export function calculateCampaignCredits(outputs: CampaignOutputs): number {
    let total = 0;
    if (outputs.generateLinkedinPost) total += CONTENT_CREDITS.linkedinPost;
    if (outputs.generateLinkedinArticle) total += CONTENT_CREDITS.linkedinArticle;
    if (outputs.generateWebBlog) total += CONTENT_CREDITS.webBlog;
    if (outputs.generateImage) total += CONTENT_CREDITS.image;
    return total;
}

// ============================================
// TYPES
// ============================================

export interface ResolvedAuthor {
    name: string;
    role: string;
    image: string;
    bio: string;
    isAiAdvisor: boolean;
}

export interface CompanySettings {
    companyName?: string | null;
    industry?: string | null;
    productsServices?: string | null;
    targetMarket?: string | null;
    blogContentDir?: string | null;
    blogImagesDir?: string | null;
    siteUrl?: string | null;
    linkedinProfileUrl?: string | null;
}

// ============================================
// SYSTEM PROMPTS
// ============================================

// Guardrails for AI advisor content to prevent fabricated experiences
const AI_ADVISOR_GUARDRAILS = `
IMPORTANT — AI Advisor Honesty Rules:
If the author is an AI advisor (not a real person), you MUST follow these rules:
- NEVER fabricate personal anecdotes, client stories, or past experiences. The author is an AI and has no real clients or history.
- NEVER use phrases like "I once worked with a client who..." or "In my experience at [company]..." or "I remember when..." or "One of my clients..."
- NEVER invent case studies, testimonials, or success stories and attribute them to the author.
- DO provide expert tips, practical advice, frameworks, and actionable strategies based on established knowledge.
- DO use hypothetical examples clearly framed as such (e.g., "Consider a scenario where..." or "For example, a company might...").
- DO cite well-known industry trends, published research, and general best practices.
- The author's voice should be that of a knowledgeable advisor sharing expertise — not someone recounting a fabricated career.`;

export const SYSTEM_PROMPTS = {
    linkedinArticle: `You are an expert LinkedIn content strategist. Create a professional, engaging LinkedIn article that establishes thought leadership.

Guidelines:
- Write from the author's perspective and voice (see author details in the brief)
- Start with a compelling hook
- Use clear, accessible language
- Include practical insights and actionable takeaways
- Break content with subheadings for scanning
- End with a call-to-action or thought-provoking question
- Keep paragraphs short (2-3 sentences)
- Target 800-1500 words
- Reference the company/industry context when relevant
${AI_ADVISOR_GUARDRAILS}

Format in Markdown with H1 title, H2 sections, bullet points where appropriate, and bold for key points.`,

    linkedinPost: `You are an expert LinkedIn content strategist. Create a compelling LinkedIn post that drives engagement.

Guidelines:
- Write from the author's perspective and voice (see author details in the brief)
- Start with a hook in the first line (this shows in preview)
- Keep it concise but valuable (150-300 words ideal)
- Use line breaks for readability
- Include a clear call-to-action
- End with a question to encourage comments
- Use 3-5 relevant hashtags at the end
- Reference the company/industry context when relevant
${AI_ADVISOR_GUARDRAILS}

Do NOT use markdown formatting - LinkedIn posts are plain text with line breaks.`,

    webBlog: `You are an expert content writer. Create an SEO-optimized blog post for a business website.

Guidelines:
- Write from the author's perspective and voice (see author details in the brief)
- Compelling, keyword-rich title
- Meta description (150-160 characters)
- Clear introduction with the main value proposition
- Structured with H2 and H3 subheadings
- Include practical examples and data
- Internal linking opportunities noted as [LINK: topic]
- Strong conclusion with next steps
- Target 1000-2000 words
- Reference the company/industry context when relevant
${AI_ADVISOR_GUARDRAILS}

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

// ============================================
// AUTHOR RESOLUTION
// ============================================

/**
 * Resolve an authorId to a full author object.
 * - "self" or undefined → user's own identity from session + settings
 * - Any other string → look up in blog-authors.ts registry
 */
export function resolveAuthor(
    authorId: string | undefined,
    session: { user?: { name?: string | null; image?: string | null } },
    settings: CompanySettings
): ResolvedAuthor {
    // Default: user's own voice
    if (!authorId || authorId === "self") {
        return {
            name: session.user?.name || "Author",
            role: "", // Will be enhanced with company context
            image: session.user?.image || "",
            bio: "",
            isAiAdvisor: false,
        };
    }

    // Look up AI advisor persona
    const author = getAuthor(authorId);
    if (author) {
        return {
            name: author.name,
            role: author.role,
            image: author.image,
            bio: author.bio,
            isAiAdvisor: true,
        };
    }

    // Fallback to user if authorId not found
    return {
        name: session.user?.name || "Author",
        role: "",
        image: session.user?.image || "",
        bio: "",
        isAiAdvisor: false,
    };
}

// ============================================
// SETTINGS FETCHER
// ============================================

/**
 * Fetch user settings directly from the database (no HTTP round-trip).
 * Returns an empty object if no settings exist.
 */
export async function fetchUserSettings(userId: string): Promise<CompanySettings> {
    try {
        const results = await db
            .select({
                companyName: userSettings.companyName,
                industry: userSettings.industry,
                productsServices: userSettings.productsServices,
                targetMarket: userSettings.targetMarket,
                blogContentDir: userSettings.blogContentDir,
                blogImagesDir: userSettings.blogImagesDir,
                siteUrl: userSettings.siteUrl,
                linkedinProfileUrl: userSettings.linkedinProfileUrl,
            })
            .from(userSettings)
            .where(eq(userSettings.userId, userId))
            .limit(1);

        if (results.length === 0) {
            return {};
        }

        return results[0];
    } catch (error) {
        console.error("[campaign-prompts] Failed to fetch user settings:", error);
        return {};
    }
}

/**
 * Resolve blog publishing directories from user settings,
 * falling back to process.cwd()-relative defaults.
 */
export function resolveBlogPaths(settings: CompanySettings): {
    contentDir: string;
    imagesDir: string;
} {
    return {
        contentDir: settings.blogContentDir?.trim() || path.join(process.cwd(), "src/content/blog"),
        imagesDir: settings.blogImagesDir?.trim() || path.join(process.cwd(), "public/images/blog"),
    };
}

// ============================================
// BRIEF CONTEXT BUILDER
// ============================================

/**
 * Build the full context string sent to Claude alongside the system prompt.
 * Includes brief details, author identity, and company profile.
 */
export function buildBriefContext(
    brief: ContentBrief,
    author?: ResolvedAuthor,
    settings?: CompanySettings
): string {
    const lines: string[] = [];

    // Brief details
    lines.push(`Topic: ${brief.topic}`);

    if (brief.targetAudience) {
        lines.push(`Target Audience: ${brief.targetAudience}`);
    }

    if (brief.keyPoints && brief.keyPoints.length > 0) {
        lines.push(`Key Points:\n${brief.keyPoints.map(p => `- ${p}`).join("\n")}`);
    }

    if (brief.tone) {
        lines.push(`Tone: ${brief.tone}`);
    }

    // Author context
    if (author) {
        lines.push("");
        lines.push("--- Author ---");
        if (author.isAiAdvisor) {
            lines.push(`Author Type: AI Advisor (NOT a real person — do NOT fabricate personal stories or client experiences)`);
        } else {
            lines.push(`Author Type: Real person`);
        }
        lines.push(`Author: ${author.name}${author.role ? `, ${author.role}` : ""}`);
        if (author.bio) {
            lines.push(`Author Bio: ${author.bio}`);
        }
    }

    // Company context
    if (settings) {
        const hasCompanyInfo = settings.companyName || settings.industry ||
            settings.productsServices || settings.targetMarket;

        if (hasCompanyInfo) {
            lines.push("");
            lines.push("--- Company Context ---");
            if (settings.companyName) {
                lines.push(`Company: ${settings.companyName}`);
            }
            if (settings.industry) {
                lines.push(`Industry: ${settings.industry}`);
            }
            if (settings.productsServices) {
                lines.push(`Products/Services: ${settings.productsServices}`);
            }
            if (settings.targetMarket) {
                lines.push(`Target Market: ${settings.targetMarket}`);
            }
        }
    }

    return lines.join("\n");
}
