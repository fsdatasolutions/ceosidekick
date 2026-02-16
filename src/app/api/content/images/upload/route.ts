// src/app/api/content/images/upload/route.ts
// API route for uploading images to Google Cloud Storage

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadImageToGCS, refreshSignedUrl } from "@/lib/gcs";
import { createContentImage } from "@/lib/services/content-images";
import { logErrorToFeedback } from "@/lib/services/error-logger";

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

        // Upload to GCS — this is required for uploads (no fallback URL like DALL-E)
        const uploadResult = await uploadImageToGCS({
            userId,
            fileName: file.name,
            mimeType: file.type,
            buffer,
        });

        // Track warnings for non-fatal errors
        const warnings: string[] = [];
        let savedImage: any = null;

        // Create database record
        try {
            savedImage = await createContentImage({
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
        } catch (dbError: any) {
            console.error("Database insert error (non-fatal):", dbError);
            warnings.push("Image was uploaded but could not be saved to the library.");
            logErrorToFeedback({
                userId,
                source: "content-image-upload-db",
                error: dbError,
                metadata: { fileName: file.name, gcsPath: uploadResult.gcsPath, size: uploadResult.size },
            });
        }

        // Deduct 1 credit for upload
        await deductMessageCredit(userId, {
            type: "content_image_upload",
            agent: "content",
            metadata: {
                imageId: savedImage?.id,
                fileName: file.name,
                size: uploadResult.size,
                hadWarnings: warnings.length > 0,
            },
        });

        // Generate a fresh signed URL for the response
        let imageUrl: string;
        try {
            imageUrl = await refreshSignedUrl(uploadResult.gcsPath, 1); // 1 day expiry
        } catch (urlError: any) {
            console.error("Signed URL generation error (non-fatal):", urlError);
            imageUrl = uploadResult.gcsUrl;
        }

        return NextResponse.json({
            success: true,
            image: {
                id: savedImage?.id || null,
                name: savedImage?.name || customName || file.name,
                url: imageUrl,
                mimeType: uploadResult.mimeType,
                size: uploadResult.size,
                width: savedImage?.width || width,
                height: savedImage?.height || height,
                source: "upload",
                createdAt: savedImage?.createdAt || new Date().toISOString(),
            },
            ...(warnings.length > 0 && { warnings }),
        });
    } catch (error: any) {
        console.error("Image upload error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to upload image" },
            { status: 500 }
        );
    }
}