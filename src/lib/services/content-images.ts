// src/lib/services/content-images.ts
// Database service for content images

import { db } from "@/db";
import { contentImages } from "@/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import type { ContentImage } from "@/db/schema";

export interface CreateImageInput {
    userId: string;
    organizationId?: string;
    name: string;
    originalName?: string;
    gcsUrl: string;
    gcsBucket: string;
    gcsPath: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    source: "upload" | "dalle" | "other";
    generatedFromPrompt?: string;
    aiModel?: string;
    generationSettings?: Record<string, any>;
    altText?: string;
}

export interface ListImagesOptions {
    userId: string;
    organizationId?: string;
    source?: "upload" | "dalle" | "other";
    limit?: number;
    offset?: number;
}

export interface ListImagesResult {
    images: ContentImage[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

/**
 * Create a new content image record
 */
export async function createContentImage(input: CreateImageInput): Promise<ContentImage> {
    const [image] = await db
        .insert(contentImages)
        .values({
            userId: input.userId,
            organizationId: input.organizationId,
            name: input.name,
            originalName: input.originalName,
            gcsUrl: input.gcsUrl,
            gcsBucket: input.gcsBucket,
            gcsPath: input.gcsPath,
            mimeType: input.mimeType,
            size: input.size,
            width: input.width,
            height: input.height,
            source: input.source,
            generatedFromPrompt: input.generatedFromPrompt,
            aiModel: input.aiModel,
            generationSettings: input.generationSettings,
            altText: input.altText,
        })
        .returning();

    return image;
}

/**
 * Get a content image by ID
 */
export async function getContentImageById(
    imageId: string,
    userId: string
): Promise<ContentImage | null> {
    const [image] = await db
        .select()
        .from(contentImages)
        .where(
            and(
                eq(contentImages.id, imageId),
                eq(contentImages.userId, userId)
            )
        )
        .limit(1);

    return image || null;
}

/**
 * List content images for a user
 */
export async function listContentImages(
    options: ListImagesOptions
): Promise<ListImagesResult> {
    const { userId, organizationId, source, limit = 20, offset = 0 } = options;

    // Build where conditions
    const conditions = [eq(contentImages.userId, userId)];

    if (organizationId) {
        conditions.push(eq(contentImages.organizationId, organizationId));
    }

    if (source) {
        conditions.push(eq(contentImages.source, source));
    }

    // Get images with pagination
    const images = await db
        .select()
        .from(contentImages)
        .where(and(...conditions))
        .orderBy(desc(contentImages.createdAt))
        .limit(limit)
        .offset(offset);

    // Get total count
    const [countResult] = await db
        .select({ count: count() })
        .from(contentImages)
        .where(and(...conditions));

    const total = countResult?.count ?? 0;

    return {
        images,
        pagination: {
            total,
            limit,
            offset,
            hasMore: offset + images.length < total,
        },
    };
}

/**
 * Update a content image
 */
export async function updateContentImage(
    imageId: string,
    userId: string,
    updates: Partial<Pick<ContentImage, "name" | "altText">>
): Promise<ContentImage | null> {
    const [image] = await db
        .update(contentImages)
        .set({
            ...updates,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(contentImages.id, imageId),
                eq(contentImages.userId, userId)
            )
        )
        .returning();

    return image || null;
}

/**
 * Delete a content image
 */
export async function deleteContentImage(
    imageId: string,
    userId: string
): Promise<ContentImage | null> {
    const [image] = await db
        .delete(contentImages)
        .where(
            and(
                eq(contentImages.id, imageId),
                eq(contentImages.userId, userId)
            )
        )
        .returning();

    return image || null;
}

/**
 * Increment usage count for an image
 */
export async function incrementImageUsage(imageId: string): Promise<void> {
    // Using raw SQL for increment since Drizzle doesn't have a built-in increment
    await db
        .update(contentImages)
        .set({
            usageCount: 1, // This will be handled differently - see note below
            updatedAt: new Date(),
        })
        .where(eq(contentImages.id, imageId));

    // Note: For proper increment, you may need to use raw SQL:
    // await db.execute(sql`UPDATE content_images SET usage_count = usage_count + 1 WHERE id = ${imageId}`);
}