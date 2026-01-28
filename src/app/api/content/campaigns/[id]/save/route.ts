// src/app/api/content/campaigns/[id]/save/route.ts
// API route for saving campaign content to the database

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    getCampaignSession,
    updateCampaignStatus,
    deleteCampaignSession,
} from "@/lib/services/content-campaigns";
import { createContentItem } from "@/lib/services/content-items";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const userId = session.user.id;

        // Get campaign
        const campaign = getCampaignSession(id, userId);
        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        const body = await request.json();
        const { 
            linkedinArticle, 
            linkedinPost, 
            webBlog,
            heroImageId,
        } = body as {
            linkedinArticle?: { title: string; content: string; description?: string };
            linkedinPost?: { content: string };
            webBlog?: { title: string; content: string; description?: string; category?: string; tags?: string[] };
            heroImageId?: string;
        };

        const savedItems: Record<string, any> = {};

        // Save LinkedIn Article
        if (linkedinArticle && campaign.outputs.generateLinkedinArticle) {
            const article = await createContentItem({
                userId,
                type: 'linkedin_article',
                title: linkedinArticle.title,
                content: linkedinArticle.content,
                description: linkedinArticle.description,
                heroImageId: heroImageId,
                generatedFromPrompt: campaign.brief.topic,
                aiModel: 'claude-sonnet-4-20250514',
            });
            savedItems.linkedinArticle = article;
        }

        // Save LinkedIn Post
        if (linkedinPost && campaign.outputs.generateLinkedinPost) {
            const post = await createContentItem({
                userId,
                type: 'linkedin_post',
                content: linkedinPost.content,
                heroImageId: heroImageId,
                generatedFromPrompt: campaign.brief.topic,
                aiModel: 'claude-sonnet-4-20250514',
            });
            savedItems.linkedinPost = post;
        }

        // Save Web Blog
        if (webBlog && campaign.outputs.generateWebBlog) {
            const blog = await createContentItem({
                userId,
                type: 'web_blog',
                title: webBlog.title,
                content: webBlog.content,
                description: webBlog.description,
                category: webBlog.category,
                tags: webBlog.tags,
                heroImageId: heroImageId,
                generatedFromPrompt: campaign.brief.topic,
                aiModel: 'claude-sonnet-4-20250514',
            });
            savedItems.webBlog = blog;
        }

        // Mark campaign as saved and clean up session
        updateCampaignStatus(id, 'saved');
        
        // Optionally delete the session after successful save
        // deleteCampaignSession(id);

        return NextResponse.json({
            success: true,
            saved: savedItems,
            message: `Saved ${Object.keys(savedItems).length} content item(s)`,
        });
    } catch (error: any) {
        console.error("Save campaign error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to save campaign" },
            { status: 500 }
        );
    }
}
