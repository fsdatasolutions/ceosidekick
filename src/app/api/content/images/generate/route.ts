// src/app/api/content/images/generate/route.ts
// API route for generating images with DALL-E

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateImage, getGenerationCredits, validateGenerationOptions, getAvailableOptions } from "@/lib/dalle";
import type { GenerationOptions, DalleModel, ImageSize, ImageQuality, ImageStyle } from "@/lib/dalle";
import { uploadImageFromUrl, refreshSignedUrl } from "@/lib/gcs";
import { createContentImage } from "@/lib/services/content-images";
import { logErrorToFeedback } from "@/lib/services/error-logger";
import { checkMessageAllowance, incrementMessageUsage } from "@/lib/usage";

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

        // Parse request body
        const body = await request.json();
        const {
            prompt,
            model = "dall-e-3",
            size = "1024x1024",
            quality = "standard",
            style = "vivid",
            name,
            altText,
        } = body as {
            prompt: string;
            model?: DalleModel;
            size?: ImageSize;
            quality?: ImageQuality;
            style?: ImageStyle;
            name?: string;
            altText?: string;
        };

        // Build generation options
        const options: GenerationOptions = {
            prompt,
            model,
            size,
            quality: model === "dall-e-3" ? quality : undefined,
            style: model === "dall-e-3" ? style : undefined,
        };

        // Validate options
        const validationError = validateGenerationOptions(options);
        if (validationError) {
            return NextResponse.json(
                { error: validationError },
                { status: 400 }
            );
        }

        // Calculate credit cost
        const creditCost = getGenerationCredits(options);

        // Check if user has enough credits
        const usageCheck = await checkMessageAllowance(userId, creditCost);
        if (!usageCheck.allowed) {
            return NextResponse.json(
                {
                    error: `Image generation requires ${creditCost} message credit${creditCost > 1 ? 's' : ''}, but you have ${usageCheck.usage.remaining} remaining. Upgrade your plan or purchase a message pack to continue.`,
                    required: creditCost,
                    usage: usageCheck.usage,
                },
                { status: 403 }
            );
        }

        // Generate image with DALL-E
        const generationResult = await generateImage(options);

        // Generate a name for the image
        const imageName = name || `AI Image - ${new Date().toISOString().split("T")[0]}`;
        const fileName = `${imageName.replace(/[^a-zA-Z0-9]/g, "_")}.png`;

        // Parse dimensions from size
        const [width, height] = size.split("x").map(Number);

        // Track warnings for non-fatal errors (GCS upload, DB insert)
        const warnings: string[] = [];
        let savedImage: any = null;
        let imageUrl: string = generationResult.imageUrl; // Fallback to DALL-E's temporary URL

        // Upload the generated image to GCS
        let uploadResult: any = null;
        try {
            uploadResult = await uploadImageFromUrl(generationResult.imageUrl, {
                userId,
                fileName,
                mimeType: "image/png",
            });
        } catch (gcsError: any) {
            console.error("GCS upload error (non-fatal):", gcsError);
            warnings.push("Image was generated but could not be saved to storage. Using temporary URL.");
            logErrorToFeedback({
                userId,
                source: "content-image-generate-gcs",
                error: gcsError,
                metadata: { prompt, model, size, fileName },
            });
        }

        // Create database record (only if GCS upload succeeded)
        if (uploadResult) {
            try {
                savedImage = await createContentImage({
                    userId,
                    name: imageName,
                    originalName: fileName,
                    gcsUrl: uploadResult.gcsUrl,
                    gcsBucket: uploadResult.gcsBucket,
                    gcsPath: uploadResult.gcsPath,
                    mimeType: "image/png",
                    size: uploadResult.size,
                    width,
                    height,
                    source: "dalle",
                    generatedFromPrompt: prompt,
                    aiModel: model,
                    generationSettings: {
                        size,
                        quality: options.quality,
                        style: options.style,
                        revisedPrompt: generationResult.revisedPrompt,
                    },
                    altText: (altText || generationResult.revisedPrompt || prompt).substring(0, 500),
                });
            } catch (dbError: any) {
                console.error("Database insert error (non-fatal):", dbError);
                warnings.push("Image was generated and uploaded but could not be saved to the library.");
                logErrorToFeedback({
                    userId,
                    source: "content-image-generate-db",
                    error: dbError,
                    metadata: { prompt, model, size, gcsPath: uploadResult.gcsPath },
                });
            }
        }

        // Generate the best available URL for the response
        if (uploadResult) {
            try {
                imageUrl = await refreshSignedUrl(uploadResult.gcsPath, 1); // 1 day expiry
            } catch (urlError: any) {
                console.error("Signed URL generation error (non-fatal):", urlError);
                // Fall back to base GCS URL — client may not be able to access it directly,
                // but it's better than nothing
                imageUrl = uploadResult.gcsUrl;
            }
        }

        // Deduct credits (image was generated regardless of storage/DB outcome)
        const updatedUsage = await incrementMessageUsage(userId, creditCost);
        console.log("[Image Generate] Credits charged:", creditCost, "| Used:", updatedUsage.messagesUsed, "/", updatedUsage.totalAvailable);

        return NextResponse.json({
            success: true,
            image: {
                id: savedImage?.id || null,
                name: savedImage?.name || imageName,
                url: imageUrl,
                mimeType: "image/png",
                size: savedImage?.size || uploadResult?.size || null,
                width,
                height,
                source: "dalle",
                prompt,
                revisedPrompt: generationResult.revisedPrompt,
                generationSettings: savedImage?.generationSettings || {
                    size,
                    quality: options.quality,
                    style: options.style,
                    revisedPrompt: generationResult.revisedPrompt,
                },
                createdAt: savedImage?.createdAt || new Date().toISOString(),
            },
            creditsUsed: creditCost,
            usage: updatedUsage,
            ...(warnings.length > 0 && { warnings }),
        });
    } catch (error: any) {
        console.error("Image generation error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate image" },
            { status: 500 }
        );
    }
}

// GET endpoint to retrieve available generation options
export async function GET() {
    return NextResponse.json(getAvailableOptions());
}