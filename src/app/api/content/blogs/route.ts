// src/app/api/content/blogs/route.ts
// API route for Web Blogs - list and create

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listContentItems, createContentItem } from "@/lib/services/content-items";

// GET - List all web blogs
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
        const category = searchParams.get("category");
        const limit = parseInt(searchParams.get("limit") || "20", 10);
        const offset = parseInt(searchParams.get("offset") || "0", 10);

        // Get blogs
        const { items, pagination } = await listContentItems({
            userId,
            type: "web_blog",
            status: status || undefined,
            limit: Math.min(Math.max(1, limit), 100),
            offset: Math.max(0, offset),
        });

        // Filter by category if provided (post-fetch filter since DB might not have category index)
        const filteredItems = category 
            ? items.filter(item => item.category === category)
            : items;

        return NextResponse.json({
            blogs: filteredItems.map((item) => ({
                id: item.id,
                title: item.title,
                description: item.description,
                content: item.content,
                status: item.status,
                category: item.category,
                tags: item.tags,
                heroImageId: item.heroImageId,
                publishedAt: item.publishedAt,
                scheduledFor: item.scheduledFor,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            })),
            pagination,
        });
    } catch (error: unknown) {
        console.error("List blogs error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to list blogs";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}

interface CreateBlogBody {
    title: string;
    content: string;
    description?: string;
    category?: string;
    tags?: string[];
    heroImageId?: string;
    generatedFromPrompt?: string;
    aiModel?: string;
}

// POST - Create a new web blog
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
        const body = await request.json() as CreateBlogBody;
        const {
            title,
            content,
            description,
            category,
            tags,
            heroImageId,
            generatedFromPrompt,
            aiModel,
        } = body;

        if (!title?.trim()) {
            return NextResponse.json(
                { error: "Title is required" },
                { status: 400 }
            );
        }

        if (!content?.trim()) {
            return NextResponse.json(
                { error: "Content is required" },
                { status: 400 }
            );
        }

        // Create blog
        const blog = await createContentItem({
            userId,
            type: "web_blog",
            title: title.trim(),
            content: content.trim(),
            description: description?.trim(),
            category: category?.trim(),
            tags,
            heroImageId,
            generatedFromPrompt,
            aiModel,
        });

        return NextResponse.json({
            success: true,
            blog: {
                id: blog.id,
                title: blog.title,
                content: blog.content,
                description: blog.description,
                status: blog.status,
                category: blog.category,
                tags: blog.tags,
                heroImageId: blog.heroImageId,
                createdAt: blog.createdAt,
            },
        });
    } catch (error: unknown) {
        console.error("Create blog error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to create blog";
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
