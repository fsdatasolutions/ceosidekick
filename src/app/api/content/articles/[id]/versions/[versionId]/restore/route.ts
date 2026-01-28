// src/app/api/content/articles/[id]/versions/[versionId]/restore/route.ts
// API route for restoring an article to a specific version

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { restoreContentVersion } from "@/lib/services/content-items";

interface RouteParams {
    params: Promise<{
        id: string;
        versionId: string;
    }>;
}

// POST - Restore article to this version
export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const { id, versionId } = await params;
        const userId = session.user.id;

        // Restore to version
        const article = await restoreContentVersion(versionId, userId);

        if (!article) {
            return NextResponse.json(
                { error: "Version not found or cannot be restored" },
                { status: 404 }
            );
        }

        // Verify it's the correct article
        if (article.id !== id) {
            return NextResponse.json(
                { error: "Version does not belong to this article" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Article restored to version",
            article: {
                id: article.id,
                title: article.title,
                content: article.content,
                description: article.description,
                currentVersionId: article.currentVersionId,
                updatedAt: article.updatedAt,
            },
        });
    } catch (error: any) {
        console.error("Restore version error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to restore version" },
            { status: 500 }
        );
    }
}
