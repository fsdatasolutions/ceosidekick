// src/types/content-engine.ts
// TypeScript types for Content Engine

// ============================================
// IMAGE TYPES
// ============================================

export type ImageSource = "upload" | "dalle" | "other";

export interface ContentImageResponse {
    id: string;
    name: string;
    url: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    source: ImageSource;
    prompt?: string;
    revisedPrompt?: string;
    altText?: string;
    usageCount?: number;
    generationSettings?: DalleGenerationSettings;
    createdAt: string;
    updatedAt?: string;
}

// ============================================
// DALL-E TYPES
// ============================================

export type DalleModel = "dall-e-2" | "dall-e-3";
export type DallE2Size = "256x256" | "512x512" | "1024x1024";
export type DallE3Size = "1024x1024" | "1024x1792" | "1792x1024";
export type ImageSize = DallE2Size | DallE3Size;
export type ImageQuality = "standard" | "hd";
export type ImageStyle = "natural" | "vivid";

export interface DalleGenerationSettings {
    size: ImageSize;
    quality?: ImageQuality;
    style?: ImageStyle;
    revisedPrompt?: string;
}

export interface GenerateImageRequest {
    prompt: string;
    model?: DalleModel;
    size?: ImageSize;
    quality?: ImageQuality;
    style?: ImageStyle;
    name?: string;
    altText?: string;
}

export interface GenerateImageResponse {
    success: boolean;
    image: ContentImageResponse;
    creditsUsed: number;
}

// ============================================
// UPLOAD TYPES
// ============================================

export interface UploadImageResponse {
    success: boolean;
    image: ContentImageResponse;
}

// ============================================
// LIST TYPES
// ============================================

export interface ListImagesParams {
    source?: ImageSource;
    limit?: number;
    offset?: number;
}

export interface PaginationInfo {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}

export interface ListImagesResponse {
    images: ContentImageResponse[];
    pagination: PaginationInfo;
}

// ============================================
// UPDATE TYPES
// ============================================

export interface UpdateImageRequest {
    name?: string;
    altText?: string;
}

export interface UpdateImageResponse {
    success: boolean;
    image: {
        id: string;
        name: string;
        altText?: string;
        updatedAt: string;
    };
}

// ============================================
// DELETE TYPES
// ============================================

export interface DeleteImageResponse {
    success: boolean;
    message: string;
    deletedId: string;
}

// ============================================
// OPTIONS TYPES (for UI)
// ============================================

export interface SizeOption {
    value: string;
    label: string;
    credits: number | { standard: number; hd: number };
}

export interface ModelOption {
    id: DalleModel;
    name: string;
    description: string;
    sizes: SizeOption[];
    supportsQuality: boolean;
    supportsStyle: boolean;
    qualityOptions?: { value: string; label: string }[];
    styleOptions?: { value: string; label: string }[];
}

export interface AvailableOptionsResponse {
    models: ModelOption[];
}

// ============================================
// ERROR TYPES
// ============================================

export interface ApiError {
    error: string;
    required?: number; // For credit errors
}
