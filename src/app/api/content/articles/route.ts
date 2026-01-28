// src/app/api/content/articles/route.ts
// API route for LinkedIn articles - list and create

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listContentItems, createContentItem } from "@/lib/services/content-items";

// GET - List all LinkedIn articles
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

        // Get articles
        const { items, pagination } = await listContentItems({
            userId,
            type: "linkedin_article",
            status: status || undefined,
            limit: Math.min(Math.max(1, limit), 100),
            offset: Math.max(0, offset),
        });

        return NextResponse.json({
            articles: items.map((item) => ({
                id: item.id,
                title: item.title,
                description: item.description,
                content: item.content,
                status: item.status,
                heroImageId: item.heroImageId,
                authorName: item.authorName,
                authorRole: item.authorRole,
                publishedAt: item.publishedAt,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            })),
            pagination,
        });
    } catch (error: any) {
        console.error("List articles error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to list articles" },
            { status: 500 }
        );
    }
}

// POST - Create a new LinkedIn article
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
        const body = await request.json();
        const {
            title,
            content,
            description,
            heroImageId,
            authorName,
            authorRole,
            authorImageUrl,
            generatedFromPrompt,
            aiModel,
        } = body;

        // Create article
        const article = await createContentItem({
            userId,
            type: "linkedin_article",
            title,
            content,
            description,
            heroImageId,
            authorName: authorName || session.user.name,
            authorRole,
            authorImageUrl: authorImageUrl || session.user.image,
            generatedFromPrompt,
            aiModel,
        });

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
                createdAt: article.createdAt,
            },
        });
    } catch (error: any) {
        console.error("Create article error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create article" },
            { status: 500 }
        );
    }
}
