// src/lib/services/content-campaigns.ts
// Service for managing content campaigns

import { db } from "@/db";
import { eq, and, desc, count } from "drizzle-orm";

// We'll use a simple approach - store campaigns in contentItems with type 'campaign'
// Or you can add the contentCampaigns table from schema-campaigns.ts

export interface ContentBrief {
    topic: string;
    targetAudience?: string;
    keyPoints?: string[];
    tone?: string;
    brandId?: string;
}

export interface CampaignOutputs {
    generateImage: boolean;
    generateLinkedinArticle: boolean;
    generateLinkedinPost: boolean;
    generateWebBlog: boolean;
}

export interface GeneratedContent {
    image?: {
        id?: string;
        url?: string;
        prompt?: string;
        status: 'pending' | 'generating' | 'completed' | 'error';
        error?: string;
    };
    linkedinArticle?: {
        id?: string;
        title?: string;
        content?: string;
        description?: string;
        status: 'pending' | 'generating' | 'completed' | 'error';
        error?: string;
    };
    linkedinPost?: {
        id?: string;
        content?: string;
        status: 'pending' | 'generating' | 'completed' | 'error';
        error?: string;
    };
    webBlog?: {
        id?: string;
        title?: string;
        content?: string;
        description?: string;
        category?: string;
        tags?: string[];
        status: 'pending' | 'generating' | 'completed' | 'error';
        error?: string;
    };
}

export interface Campaign {
    id: string;
    userId: string;
    name?: string;
    brief: ContentBrief;
    outputs: CampaignOutputs;
    generated: GeneratedContent;
    status: 'draft' | 'generating' | 'review' | 'saved' | 'published';
    createdAt: Date;
    updatedAt: Date;
}

// In-memory store for active campaign sessions (before saving to DB)
// In production, you might want to use Redis or persist to DB immediately
const activeCampaigns = new Map<string, Campaign>();

/**
 * Create a new campaign session
 */
export function createCampaignSession(userId: string, brief: ContentBrief, outputs: CampaignOutputs): Campaign {
    const campaign: Campaign = {
        id: crypto.randomUUID(),
        userId,
        name: brief.topic.substring(0, 100),
        brief,
        outputs,
        generated: {},
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    // Initialize generated content placeholders
    if (outputs.generateImage) {
        campaign.generated.image = { status: 'pending' };
    }
    if (outputs.generateLinkedinArticle) {
        campaign.generated.linkedinArticle = { status: 'pending' };
    }
    if (outputs.generateLinkedinPost) {
        campaign.generated.linkedinPost = { status: 'pending' };
    }
    if (outputs.generateWebBlog) {
        campaign.generated.webBlog = { status: 'pending' };
    }

    activeCampaigns.set(campaign.id, campaign);
    return campaign;
}

/**
 * Get an active campaign session
 */
export function getCampaignSession(campaignId: string, userId: string): Campaign | null {
    const campaign = activeCampaigns.get(campaignId);
    if (campaign && campaign.userId === userId) {
        return campaign;
    }
    return null;
}

/**
 * Update campaign generated content
 */
export function updateCampaignContent(
    campaignId: string,
    contentType: keyof GeneratedContent,
    update: Partial<GeneratedContent[keyof GeneratedContent]>
): Campaign | null {
    const campaign = activeCampaigns.get(campaignId);
    if (!campaign) return null;

    campaign.generated[contentType] = {
        ...campaign.generated[contentType],
        ...update,
    } as any;
    campaign.updatedAt = new Date();

    // Check if all content is generated
    const allCompleted = Object.values(campaign.generated).every(
        (content) => content?.status === 'completed' || content?.status === 'error'
    );
    if (allCompleted && campaign.status === 'generating') {
        campaign.status = 'review';
    }

    activeCampaigns.set(campaignId, campaign);
    return campaign;
}

/**
 * Update campaign status
 */
export function updateCampaignStatus(
    campaignId: string,
    status: Campaign['status']
): Campaign | null {
    const campaign = activeCampaigns.get(campaignId);
    if (!campaign) return null;

    campaign.status = status;
    campaign.updatedAt = new Date();
    activeCampaigns.set(campaignId, campaign);
    return campaign;
}

/**
 * Delete a campaign session
 */
export function deleteCampaignSession(campaignId: string): boolean {
    return activeCampaigns.delete(campaignId);
}

/**
 * Clean up old campaign sessions (call periodically)
 */
export function cleanupOldSessions(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [id, campaign] of activeCampaigns) {
        if (now - campaign.createdAt.getTime() > maxAgeMs) {
            activeCampaigns.delete(id);
            cleaned++;
        }
    }
    
    return cleaned;
}
