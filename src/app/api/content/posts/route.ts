// src/app/api/content/posts/route.ts
// API route for LinkedIn posts - list and create

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listContentItems, createContentItem } from "@/lib/services/content-items";

// GET - List all LinkedIn posts
export async function GET(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") as "draft" | "published" | "archived" | null;
        const limit = parseInt(searchParams.get("limit") || "20", 10);
        const offset = parseInt(searchParams.get("offset") || "0", 10);

        // Get posts
        const { items, pagination } = await listContentItems({
            userId,
            type: "linkedin_post",
            status: status || undefined,
            limit: Math.min(Math.max(1, limit), 100),
            offset: Math.max(0, offset),
        });

        return NextResponse.json({
            posts: items.map((item) => ({
                id: item.id,
                content: item.content,
                status: item.status,
                linkedinPostType: item.linkedinPostType,
                heroImageId: item.heroImageId,
                publishedAt: item.publishedAt,
                scheduledFor: item.scheduledFor,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            })),
            pagination,
        });
    } catch (error: unknown) {
        console.error("List posts error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to list posts";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

interface CreatePostBody {
    content: string;
    linkedinPostType?: string;
    heroImageId?: string;
    generatedFromPrompt?: string;
    aiModel?: string;
}

// POST - Create a new LinkedIn post
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // Parse request body
        const body = await request.json() as CreatePostBody;
        const {
            content,
            linkedinPostType = "text",
            heroImageId,
            generatedFromPrompt,
            aiModel,
        } = body;

        if (!content?.trim()) {
            return NextResponse.json(
                { error: "Content is required" },
                { status: 400 }
            );
        }

        // Create post
        const post = await createContentItem({
            userId,
            type: "linkedin_post",
            content: content.trim(),
            linkedinPostType,
            heroImageId,
            generatedFromPrompt,
            aiModel,
        });

        return NextResponse.json({
            success: true,
            post: {
                id: post.id,
                content: post.content,
                status: post.status,
                linkedinPostType: post.linkedinPostType,
                heroImageId: post.heroImageId,
                createdAt: post.createdAt,
            },
        });
    } catch (error: unknown) {
        console.error("Create post error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to create post";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
