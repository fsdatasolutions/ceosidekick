// src/app/api/content/articles/[id]/versions/route.ts
// API route for article version management

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    getContentItemById,
    getContentVersions,
    createContentVersion,
} from "@/lib/services/content-items";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// GET - Get all versions for an article
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

        // Verify article exists
        const article = await getContentItemById(id, userId);
        if (!article) {
            return NextResponse.json(
                { error: "Article not found" },
                { status: 404 }
            );
        }

        // Get versions
        const versions = await getContentVersions(id, userId);

        return NextResponse.json({
            versions: versions.map((v) => ({
                id: v.id,
                versionNumber: v.versionNumber,
                versionLabel: v.versionLabel,
                title: v.title,
                changeNotes: v.changeNotes,
                createdAt: v.createdAt,
                isCurrent: v.id === article.currentVersionId,
            })),
            currentVersionId: article.currentVersionId,
        });
    } catch (error: any) {
        console.error("Get versions error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to get versions" },
            { status: 500 }
        );
    }
}

// POST - Create a new version (save milestone)
export async function POST(request: NextRequest, { params }: RouteParams) {
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

        // Verify article exists
        const article = await getContentItemById(id, userId);
        if (!article) {
            return NextResponse.json(
                { error: "Article not found" },
                { status: 404 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { versionLabel, changeNotes } = body;

        // Create version
        const version = await createContentVersion({
            contentItemId: id,
            versionLabel,
            changeNotes,
            createdBy: userId,
        });

        if (!version) {
            return NextResponse.json(
                { error: "Failed to create version" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            version: {
                id: version.id,
                versionNumber: version.versionNumber,
                versionLabel: version.versionLabel,
                changeNotes: version.changeNotes,
                createdAt: version.createdAt,
            },
        });
    } catch (error: any) {
        console.error("Create version error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create version" },
            { status: 500 }
        );
    }
}
