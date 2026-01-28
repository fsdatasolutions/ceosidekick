// src/app/api/content/articles/[id]/route.ts
// API route for individual LinkedIn article operations

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    getContentItemById,
    updateContentItem,
    deleteContentItem,
    publishContentItem,
    archiveContentItem,
} from "@/lib/services/content-items";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// GET - Get a single article
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const userId = session.user.id;

        const article = await getContentItemById(id, userId);

        if (!article) {
            return NextResponse.json(
                { error: "Article not found" },
                { status: 404 }
            );
        }

        // Verify it's a LinkedIn article
        if (article.type !== "linkedin_article") {
            return NextResponse.json(
                { error: "Not a LinkedIn article" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            article: {
                id: article.id,
                title: article.title,
                description: article.description,
                content: article.content,
                status: article.status,
                heroImageId: article.heroImageId,
                authorName: article.authorName,
                authorRole: article.authorRole,
                authorImageUrl: article.authorImageUrl,
                publishedAt: article.publishedAt,
                scheduledFor: article.scheduledFor,
                generatedFromPrompt: article.generatedFromPrompt,
                aiModel: article.aiModel,
                currentVersionId: article.currentVersionId,
                createdAt: article.createdAt,
                updatedAt: article.updatedAt,
            },
        });
    } catch (error: any) {
        console.error("Get article error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to get article" },
            { status: 500 }
        );
    }
}

// PATCH - Update an article
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const userId = session.user.id;

        // Verify the article exists and is a LinkedIn article
        const existing = await getContentItemById(id, userId);
        if (!existing) {
            return NextResponse.json(
                { error: "Article not found" },
                { status: 404 }
            );
        }
        if (existing.type !== "linkedin_article") {
            return NextResponse.json(
                { error: "Not a LinkedIn article" },
                { status: 400 }
            );
        }

        // Parse request body
        const body = await request.json();
        const {
            title,
            content,
            description,
            heroImageId,
            authorName,
            authorRole,
            authorImageUrl,
            status,
        } = body;

        // Build updates object (only include provided fields)
        const updates: Record<string, any> = {};
        if (title !== undefined) updates.title = title;
        if (content !== undefined) updates.content = content;
        if (description !== undefined) updates.description = description;
        if (heroImageId !== undefined) updates.heroImageId = heroImageId;
        if (authorName !== undefined) updates.authorName = authorName;
        if (authorRole !== undefined) updates.authorRole = authorRole;
        if (authorImageUrl !== undefined) updates.authorImageUrl = authorImageUrl;
        if (status !== undefined) updates.status = status;

        const article = await updateContentItem(id, userId, updates);

        if (!article) {
            return NextResponse.json(
                { error: "Failed to update article" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            article: {
                id: article.id,
                title: article.title,
                description: article.description,
                content: article.content,
                status: article.status,
                heroImageId: article.heroImageId,
                authorName: article.authorName,
                authorRole: article.authorRole,
                updatedAt: article.updatedAt,
            },
        });
    } catch (error: any) {
        console.error("Update article error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update article" },
            { status: 500 }
        );
    }
}

// DELETE - Delete an article
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id } = await params;
        const userId = session.user.id;

        // Verify the article exists
        const existing = await getContentItemById(id, userId);
        if (!existing) {
            return NextResponse.json(
                { error: "Article not found" },
                { status: 404 }
            );
        }
        if (existing.type !== "linkedin_article") {
            return NextResponse.json(
                { error: "Not a LinkedIn article" },
                { status: 400 }
            );
        }

        const deleted = await deleteContentItem(id, userId);

        if (!deleted) {
            return NextResponse.json(
                { error: "Failed to delete article" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Article deleted successfully",
            deletedId: id,
        });
    } catch (error: any) {
        console.error("Delete article error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete article" },
            { status: 500 }
        );
    }
}
