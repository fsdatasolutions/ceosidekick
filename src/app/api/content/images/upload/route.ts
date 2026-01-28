// src/app/api/content/images/upload/route.ts
// API route for uploading images to Google Cloud Storage

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadImageToGCS } from "@/lib/gcs";
import { createContentImage } from "@/lib/services/content-images";

// TODO: Import your actual usage/credit functions
// import { deductMessageCredit, checkMessageCredits } from "@/lib/services/usage";

// Temporary mock functions until you integrate with your existing usage system
async function checkMessageCredits(userId: string): Promise<boolean> {
    // Replace with your actual credit check logic
    return true;
}

async function deductMessageCredit(userId: string, logData?: any): Promise<void> {
    // Replace with your actual credit deduction logic
    console.log(`[Credits] Would deduct 1 credit from user ${userId}`);
}

// Allowed MIME types
const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
];

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
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

        // Check if user has credits
        const hasCredits = await checkMessageCredits(userId);
        if (!hasCredits) {
            return NextResponse.json(
                { error: "Insufficient message credits" },
                { status: 402 }
            );
        }

        // Parse form data
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const altText = formData.get("altText") as string | null;
        const customName = formData.get("name") as string | null;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: `Invalid file type. Allowed: ${ALLOWED_TYPES.join(", ")}` },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
                { status: 400 }
            );
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Get image dimensions using sharp (optional - wrap in try/catch)
        let width: number | undefined;
        let height: number | undefined;

        try {
            const sharp = (await import("sharp")).default;
            const metadata = await sharp(buffer).metadata();
            width = metadata.width;
            height = metadata.height;
        } catch (e) {
            // If sharp fails, continue without dimensions
            console.warn("Could not extract image dimensions:", e);
        }

        // Upload to GCS
        const uploadResult = await uploadImageToGCS({
            userId,
            fileName: file.name,
            mimeType: file.type,
            buffer,
        });

        // Create database record
        const image = await createContentImage({
            userId,
            name: customName || file.name,
            originalName: file.name,
            gcsUrl: uploadResult.gcsUrl,
            gcsBucket: uploadResult.gcsBucket,
            gcsPath: uploadResult.gcsPath,
            mimeType: uploadResult.mimeType,
            size: uploadResult.size,
            width,
            height,
            source: "upload",
            altText: altText || undefined,
        });

        // Deduct 1 credit for upload
        await deductMessageCredit(userId, {
            type: "content_image_upload",
            agent: "content",
            metadata: {
                imageId: image.id,
                fileName: file.name,
                size: uploadResult.size,
            },
        });

        return NextResponse.json({
            success: true,
            image: {
                id: image.id,
                name: image.name,
                url: image.gcsUrl,
                mimeType: image.mimeType,
                size: image.size,
                width: image.width,
                height: image.height,
                source: image.source,
                createdAt: image.createdAt,
            },
        });
    } catch (error: any) {
        console.error("Image upload error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to upload image" },
            { status: 500 }
        );
    }
}