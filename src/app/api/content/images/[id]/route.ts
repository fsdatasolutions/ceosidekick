// src/app/api/content/images/[id]/route.ts
// API route for individual image operations

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
    getContentImageById,
    updateContentImage,
    deleteContentImage,
} from "@/lib/services/content-images";
import { deleteImageFromGCS } from "@/lib/gcs";

interface RouteParams {
    params: Promise<{
        id: string;
    }>;
}

// GET - Retrieve a single image
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

        const image = await getContentImageById(id, userId);

        if (!image) {
            return NextResponse.json(
                { error: "Image not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            image: {
                id: image.id,
                name: image.name,
                originalName: image.originalName,
                url: image.gcsUrl,
                mimeType: image.mimeType,
                size: image.size,
                width: image.width,
                height: image.height,
                source: image.source,
                prompt: image.generatedFromPrompt,
                aiModel: image.aiModel,
                generationSettings: image.generationSettings,
                altText: image.altText,
                usageCount: image.usageCount,
                createdAt: image.createdAt,
                updatedAt: image.updatedAt,
            },
        });
    } catch (error: any) {
        console.error("Get image error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to get image" },
            { status: 500 }
        );
    }
}

// PATCH - Update image metadata
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

        // Parse request body
        const body = await request.json();
        const { name, altText } = body as {
            name?: string;
            altText?: string;
        };

        // Validate at least one field is provided
        if (!name && altText === undefined) {
            return NextResponse.json(
                { error: "No updates provided. Allowed fields: name, altText" },
                { status: 400 }
            );
        }

        // Build updates object
        const updates: { name?: string; altText?: string } = {};
        if (name) updates.name = name;
        if (altText !== undefined) updates.altText = altText;

        const image = await updateContentImage(id, userId, updates);

        if (!image) {
            return NextResponse.json(
                { error: "Image not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            image: {
                id: image.id,
                name: image.name,
                altText: image.altText,
                updatedAt: image.updatedAt,
            },
        });
    } catch (error: any) {
        console.error("Update image error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to update image" },
            { status: 500 }
        );
    }
}

// DELETE - Delete an image
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

        // Get the image first to get the GCS path
        const existingImage = await getContentImageById(id, userId);

        if (!existingImage) {
            return NextResponse.json(
                { error: "Image not found" },
                { status: 404 }
            );
        }

        // Delete from database
        const deletedImage = await deleteContentImage(id, userId);

        if (!deletedImage) {
            return NextResponse.json(
                { error: "Failed to delete image" },
                { status: 500 }
            );
        }

        // Delete from GCS (don't fail if GCS delete fails)
        try {
            await deleteImageFromGCS(deletedImage.gcsPath);
        } catch (gcsError) {
            console.error("Failed to delete image from GCS:", gcsError);
            // Continue anyway - db record is already deleted
        }

        return NextResponse.json({
            success: true,
            message: "Image deleted successfully",
            deletedId: id,
        });
    } catch (error: any) {
        console.error("Delete image error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete image" },
            { status: 500 }
        );
    }
}