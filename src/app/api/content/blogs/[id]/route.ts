// src/app/api/content/blogs/[id]/route.ts
// API route for individual web blog operations

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    getContentItemById,
    updateContentItem,
    deleteContentItem,
} from "@/lib/services/content-items";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// GET - Get a single blog
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

        const blog = await getContentItemById(id, userId);

        if (!blog) {
            return NextResponse.json(
                { error: "Blog not found" },
                { status: 404 }
            );
        }

        // Verify it's a web blog
        if (blog.type !== "web_blog") {
            return NextResponse.json(
                { error: "Not a web blog" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            blog: {
                id: blog.id,
                title: blog.title,
                description: blog.description,
                content: blog.content,
                status: blog.status,
                category: blog.category,
                tags: blog.tags,
                heroImageId: blog.heroImageId,
                publishedAt: blog.publishedAt,
                scheduledFor: blog.scheduledFor,
                generatedFromPrompt: blog.generatedFromPrompt,
                aiModel: blog.aiModel,
                createdAt: blog.createdAt,
                updatedAt: blog.updatedAt,
            },
        });
    } catch (error: unknown) {
        console.error("Get blog error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to get blog";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

interface UpdateBlogBody {
    title?: string;
    content?: string;
    description?: string;
    category?: string;
    tags?: string[];
    heroImageId?: string | null;
    status?: "draft" | "published" | "archived";
}

// PATCH - Update a blog
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

        // Verify the blog exists and is a web blog
        const existing = await getContentItemById(id, userId);
        if (!existing) {
            return NextResponse.json(
                { error: "Blog not found" },
                { status: 404 }
            );
        }
        if (existing.type !== "web_blog") {
            return NextResponse.json(
                { error: "Not a web blog" },
                { status: 400 }
            );
        }

        // Parse request body
        const body = await request.json() as UpdateBlogBody;
        const {
            title,
            content,
            description,
            category,
            tags,
            heroImageId,
            status,
        } = body;

        // Build updates object (only include provided fields)
        const updates: Record<string, unknown> = {};
        if (title !== undefined) updates.title = title;
        if (content !== undefined) updates.content = content;
        if (description !== undefined) updates.description = description;
        if (category !== undefined) updates.category = category;
        if (tags !== undefined) updates.tags = tags;
        if (heroImageId !== undefined) updates.heroImageId = heroImageId;
        if (status !== undefined) {
            updates.status = status;
            if (status === "published") {
                updates.publishedAt = new Date();
            }
        }

        const blog = await updateContentItem(id, userId, updates);

        if (!blog) {
            return NextResponse.json(
                { error: "Failed to update blog" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            blog: {
                id: blog.id,
                title: blog.title,
                description: blog.description,
                content: blog.content,
                status: blog.status,
                category: blog.category,
                tags: blog.tags,
                heroImageId: blog.heroImageId,
                publishedAt: blog.publishedAt,
                updatedAt: blog.updatedAt,
            },
        });
    } catch (error: unknown) {
        console.error("Update blog error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to update blog";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

// DELETE - Delete a blog
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

        // Verify the blog exists
        const existing = await getContentItemById(id, userId);
        if (!existing) {
            return NextResponse.json(
                { error: "Blog not found" },
                { status: 404 }
            );
        }
        if (existing.type !== "web_blog") {
            return NextResponse.json(
                { error: "Not a web blog" },
                { status: 400 }
            );
        }

        const deleted = await deleteContentItem(id, userId);

        if (!deleted) {
            return NextResponse.json(
                { error: "Failed to delete blog" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Blog deleted successfully",
            deletedId: id,
        });
    } catch (error: unknown) {
        console.error("Delete blog error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to delete blog";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
