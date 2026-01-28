// src/app/api/content/images/route.ts
// API route for listing content images

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listContentImages } from "@/lib/services/content-images";

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

        return NextResponse.json({
            images: images.map((image) => ({
                id: image.id,
                name: image.name,
                url: image.gcsUrl,
                mimeType: image.mimeType,
                size: image.size,
                width: image.width,
                height: image.height,
                source: image.source,
                prompt: image.generatedFromPrompt,
                altText: image.altText,
                usageCount: image.usageCount,
                createdAt: image.createdAt,
            })),
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