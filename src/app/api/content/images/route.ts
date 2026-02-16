// src/app/api/content/images/route.ts
// API route for listing content images

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listContentImages } from "@/lib/services/content-images";
import { refreshSignedUrl } from "@/lib/gcs";

export async function GET(request: NextRequest) {
    try {
        // Authenticate user
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
        const source = searchParams.get("source") as "upload" | "dalle" | "other" | null;
        const limit = parseInt(searchParams.get("limit") || "20", 10);
        const offset = parseInt(searchParams.get("offset") || "0", 10);

        // Validate pagination
        const validLimit = Math.min(Math.max(1, limit), 100);
        const validOffset = Math.max(0, offset);

        // Get images
        const { images, pagination } = await listContentImages({
            userId,
            source: source || undefined,
            limit: validLimit,
            offset: validOffset,
        });

        // Generate fresh signed URLs for all images
        const imagesWithUrls = await Promise.all(
            images.map(async (image) => ({
                id: image.id,
                name: image.name,
                url: await refreshSignedUrl(image.gcsPath, 1), // 1 day expiry
                mimeType: image.mimeType,
                size: image.size,
                width: image.width,
                height: image.height,
                source: image.source,
                prompt: image.generatedFromPrompt,
                altText: image.altText,
                usageCount: image.usageCount,
                createdAt: image.createdAt,
            }))
        );

        return NextResponse.json({
            images: imagesWithUrls,
            pagination,
        });
    } catch (error: any) {
        console.error("List images error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to list images" },
            { status: 500 }
        );
    }
}