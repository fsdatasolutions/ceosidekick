// src/lib/dalle.ts
// DALL-E image generation utility for Content Engine

import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// DALL-E Model Options
export type DalleModel = "dall-e-2" | "dall-e-3";

// Size options per model
export type DallE2Size = "256x256" | "512x512" | "1024x1024";
export type DallE3Size = "1024x1024" | "1024x1792" | "1792x1024";
export type ImageSize = DallE2Size | DallE3Size;

// Quality options (DALL-E 3 only)
export type ImageQuality = "standard" | "hd";

// Style options (DALL-E 3 only)
export type ImageStyle = "natural" | "vivid";

export interface GenerationOptions {
    prompt: string;
    model: DalleModel;
    size: ImageSize;
    quality?: ImageQuality; // DALL-E 3 only
    style?: ImageStyle; // DALL-E 3 only
}

export interface GenerationResult {
    imageUrl: string;
    revisedPrompt?: string; // DALL-E 3 may revise the prompt
    model: DalleModel;
    size: ImageSize;
    quality?: ImageQuality;
    style?: ImageStyle;
}

// Credit costs per generation (in message credits)
export const GENERATION_CREDITS: Record<DalleModel, Record<string, number>> = {
    "dall-e-2": {
        "256x256": 1,
        "512x512": 1,
        "1024x1024": 1,
    },
    "dall-e-3": {
        "1024x1024-standard": 2,
        "1024x1024-hd": 3,
        "1024x1792-standard": 3,
        "1792x1024-standard": 3,
        "1024x1792-hd": 4,
        "1792x1024-hd": 4,
    },
};

/**
 * Get the credit cost for a generation
 */
export function getGenerationCredits(options: GenerationOptions): number {
    const { model, size, quality = "standard" } = options;
    
    if (model === "dall-e-2") {
        return GENERATION_CREDITS["dall-e-2"][size] || 1;
    }
    
    const key = `${size}-${quality}`;
    return GENERATION_CREDITS["dall-e-3"][key] || 2;
}

/**
 * Validate generation options
 */
export function validateGenerationOptions(options: GenerationOptions): string | null {
    const { model, size, prompt } = options;
    
    if (!prompt || prompt.trim().length === 0) {
        return "Prompt is required";
    }
    
    if (prompt.length > 4000) {
        return "Prompt must be 4000 characters or less";
    }
    
    // Validate size for model
    if (model === "dall-e-2") {
        const validSizes: DallE2Size[] = ["256x256", "512x512", "1024x1024"];
        if (!validSizes.includes(size as DallE2Size)) {
            return `Invalid size for DALL-E 2. Valid sizes: ${validSizes.join(", ")}`;
        }
    } else if (model === "dall-e-3") {
        const validSizes: DallE3Size[] = ["1024x1024", "1024x1792", "1792x1024"];
        if (!validSizes.includes(size as DallE3Size)) {
            return `Invalid size for DALL-E 3. Valid sizes: ${validSizes.join(", ")}`;
        }
    } else {
        return "Invalid model. Choose dall-e-2 or dall-e-3";
    }
    
    return null;
}

/**
 * Generate an image using DALL-E
 */
export async function generateImage(options: GenerationOptions): Promise<GenerationResult> {
    const { prompt, model, size, quality = "standard", style = "vivid" } = options;
    
    // Validate options
    const validationError = validateGenerationOptions(options);
    if (validationError) {
        throw new Error(validationError);
    }
    
    try {
        if (model === "dall-e-2") {
            const response = await openai.images.generate({
                model: "dall-e-2",
                prompt,
                n: 1,
                size: size as DallE2Size,
                response_format: "url",
            });
            
            const imageData = response.data[0];
            
            if (!imageData.url) {
                throw new Error("No image URL returned from DALL-E");
            }
            
            return {
                imageUrl: imageData.url,
                model,
                size,
            };
        } else {
            // DALL-E 3
            const response = await openai.images.generate({
                model: "dall-e-3",
                prompt,
                n: 1,
                size: size as DallE3Size,
                quality,
                style,
                response_format: "url",
            });
            
            const imageData = response.data[0];
            
            if (!imageData.url) {
                throw new Error("No image URL returned from DALL-E");
            }
            
            return {
                imageUrl: imageData.url,
                revisedPrompt: imageData.revised_prompt,
                model,
                size,
                quality,
                style,
            };
        }
    } catch (error: any) {
        // Handle OpenAI API errors
        if (error.code === "content_policy_violation") {
            throw new Error("Your prompt was rejected due to content policy. Please revise and try again.");
        }
        
        if (error.code === "rate_limit_exceeded") {
            throw new Error("Rate limit exceeded. Please try again in a moment.");
        }
        
        throw new Error(`Image generation failed: ${error.message}`);
    }
}

/**
 * Get available options for the UI
 */
export function getAvailableOptions() {
    return {
        models: [
            {
                id: "dall-e-2",
                name: "DALL-E 2",
                description: "Faster generation, lower cost",
                sizes: [
                    { value: "256x256", label: "256×256 (Small)", credits: 1 },
                    { value: "512x512", label: "512×512 (Medium)", credits: 1 },
                    { value: "1024x1024", label: "1024×1024 (Large)", credits: 1 },
                ],
                supportsQuality: false,
                supportsStyle: false,
            },
            {
                id: "dall-e-3",
                name: "DALL-E 3",
                description: "Higher quality, better prompt understanding",
                sizes: [
                    { value: "1024x1024", label: "1024×1024 (Square)", credits: { standard: 2, hd: 3 } },
                    { value: "1024x1792", label: "1024×1792 (Portrait)", credits: { standard: 3, hd: 4 } },
                    { value: "1792x1024", label: "1792×1024 (Landscape)", credits: { standard: 3, hd: 4 } },
                ],
                supportsQuality: true,
                supportsStyle: true,
                qualityOptions: [
                    { value: "standard", label: "Standard" },
                    { value: "hd", label: "HD (Higher detail)" },
                ],
                styleOptions: [
                    { value: "vivid", label: "Vivid (Dramatic, hyper-real)" },
                    { value: "natural", label: "Natural (More realistic)" },
                ],
            },
        ],
    };
}
