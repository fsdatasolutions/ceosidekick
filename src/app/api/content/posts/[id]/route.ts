// src/app/api/content/posts/[id]/route.ts
// API route for individual LinkedIn post operations

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

// GET - Get a single post
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

        const post = await getContentItemById(id, userId);

        if (!post) {
            return NextResponse.json(
                { error: "Post not found" },
                { status: 404 }
            );
        }

        // Verify it's a LinkedIn post
        if (post.type !== "linkedin_post") {
            return NextResponse.json(
                { error: "Not a LinkedIn post" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            post: {
                id: post.id,
                content: post.content,
                status: post.status,
                linkedinPostType: post.linkedinPostType,
                heroImageId: post.heroImageId,
                publishedAt: post.publishedAt,
                scheduledFor: post.scheduledFor,
                generatedFromPrompt: post.generatedFromPrompt,
                aiModel: post.aiModel,
                createdAt: post.createdAt,
                updatedAt: post.updatedAt,
            },
        });
    } catch (error: unknown) {
        console.error("Get post error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to get post";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

interface UpdatePostBody {
    content?: string;
    linkedinPostType?: string;
    heroImageId?: string | null;
    status?: "draft" | "published" | "archived";
}

// PATCH - Update a post
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

        // Verify the post exists and is a LinkedIn post
        const existing = await getContentItemById(id, userId);
        if (!existing) {
            return NextResponse.json(
                { error: "Post not found" },
                { status: 404 }
            );
        }
        if (existing.type !== "linkedin_post") {
            return NextResponse.json(
                { error: "Not a LinkedIn post" },
                { status: 400 }
            );
        }

        // Parse request body
        const body = await request.json() as UpdatePostBody;
        const {
            content,
            linkedinPostType,
            heroImageId,
            status,
        } = body;

        // Build updates object (only include provided fields)
        const updates: Record<string, unknown> = {};
        if (content !== undefined) updates.content = content;
        if (linkedinPostType !== undefined) updates.linkedinPostType = linkedinPostType;
        if (heroImageId !== undefined) updates.heroImageId = heroImageId;
        if (status !== undefined) {
            updates.status = status;
            if (status === "published") {
                updates.publishedAt = new Date();
            }
        }

        const post = await updateContentItem(id, userId, updates);

        if (!post) {
            return NextResponse.json(
                { error: "Failed to update post" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            post: {
                id: post.id,
                content: post.content,
                status: post.status,
                linkedinPostType: post.linkedinPostType,
                heroImageId: post.heroImageId,
                publishedAt: post.publishedAt,
                updatedAt: post.updatedAt,
            },
        });
    } catch (error: unknown) {
        console.error("Update post error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to update post";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

// DELETE - Delete a post
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

        // Verify the post exists
        const existing = await getContentItemById(id, userId);
        if (!existing) {
            return NextResponse.json(
                { error: "Post not found" },
                { status: 404 }
            );
        }
        if (existing.type !== "linkedin_post") {
            return NextResponse.json(
                { error: "Not a LinkedIn post" },
                { status: 400 }
            );
        }

        const deleted = await deleteContentItem(id, userId);

        if (!deleted) {
            return NextResponse.json(
                { error: "Failed to delete post" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Post deleted successfully",
            deletedId: id,
        });
    } catch (error: unknown) {
        console.error("Delete post error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to delete post";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
