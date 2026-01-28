// src/app/api/content/images/generate/route.ts
// API route for generating images with DALL-E

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateImage, getGenerationCredits, validateGenerationOptions, getAvailableOptions } from "@/lib/dalle";
import type { GenerationOptions, DalleModel, ImageSize, ImageQuality, ImageStyle } from "@/lib/dalle";
import { uploadImageFromUrl } from "@/lib/gcs";
import { createContentImage } from "@/lib/services/content-images";

// TODO: Import your actual usage/credit functions
// import { deductMessageCredits, checkMessageCreditsAmount } from "@/lib/services/usage";

// Temporary mock functions until you integrate with your existing usage system
async function checkMessageCreditsAmount(userId: string, amount: number): Promise<boolean> {
    // Replace with your actual credit check logic
    return true;
}

async function deductMessageCredits(userId: string, amount: number, logData?: any): Promise<void> {
    // Replace with your actual credit deduction logic
    console.log(`[Credits] Would deduct ${amount} credits from user ${userId}`);
}

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
        const hasCredits = await checkMessageCreditsAmount(userId, creditCost);
        if (!hasCredits) {
            return NextResponse.json(
                {
                    error: "Insufficient message credits",
                    required: creditCost,
                },
                { status: 402 }
            );
        }

        // Generate image with DALL-E
        const generationResult = await generateImage(options);

        // Generate a name for the image
        const imageName = name || `AI Image - ${new Date().toISOString().split("T")[0]}`;
        const fileName = `${imageName.replace(/[^a-zA-Z0-9]/g, "_")}.png`;

        // Upload the generated image to GCS
        const uploadResult = await uploadImageFromUrl(generationResult.imageUrl, {
            userId,
            fileName,
            mimeType: "image/png",
        });

        // Parse dimensions from size
        const [width, height] = size.split("x").map(Number);

        // Create database record
        const image = await createContentImage({
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
            altText: altText || generationResult.revisedPrompt || prompt.substring(0, 500),
        });

        // Deduct credits
        await deductMessageCredits(userId, creditCost, {
            type: "content_image_generate",
            agent: "content",
            metadata: {
                imageId: image.id,
                model,
                size,
                quality: options.quality,
                style: options.style,
                creditCost,
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
                prompt: image.generatedFromPrompt,
                revisedPrompt: generationResult.revisedPrompt,
                generationSettings: image.generationSettings,
                createdAt: image.createdAt,
            },
            creditsUsed: creditCost,
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