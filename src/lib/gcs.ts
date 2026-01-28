// src/lib/gcs.ts
// Google Cloud Storage utility for Content Engine images
// Uses signed URLs instead of public access

import { Storage } from "@google-cloud/storage";

// Initialize GCS client
function getStorageClient(): Storage {
    const credentials = process.env.GCS_CREDENTIALS;

    if (!credentials) {
        throw new Error("GCS_CREDENTIALS environment variable is not set");
    }

    try {
        const parsedCredentials = JSON.parse(credentials);
        return new Storage({
            credentials: parsedCredentials,
            projectId: parsedCredentials.project_id,
        });
    } catch (error) {
        throw new Error("Failed to parse GCS_CREDENTIALS JSON");
    }
}

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "ceosidekick-documents";

export interface UploadResult {
    gcsUrl: string;
    gcsBucket: string;
    gcsPath: string;
    size: number;
    mimeType: string;
}

export interface UploadOptions {
    userId: string;
    fileName: string;
    mimeType: string;
    buffer: Buffer;
}

/**
 * Generate a long-lived signed URL for reading a file
 * Valid for 7 days by default
 */
async function generateReadSignedUrl(
    gcsPath: string,
    expiresInDays: number = 7
): Promise<string> {
    const storage = getStorageClient();
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(gcsPath);

    const [url] = await file.getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
    });

    return url;
}

/**
 * Upload an image to Google Cloud Storage
 * Returns a signed URL for access (since bucket has public access prevention)
 */
export async function uploadImageToGCS(options: UploadOptions): Promise<UploadResult> {
    const { userId, fileName, mimeType, buffer } = options;

    const storage = getStorageClient();
    const bucket = storage.bucket(BUCKET_NAME);

    // Generate unique path: content-engine/{userId}/images/{uuid}-{filename}
    const uuid = crypto.randomUUID();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
    const gcsPath = `content-engine/${userId}/images/${uuid}-${sanitizedFileName}`;

    const file = bucket.file(gcsPath);

    await file.save(buffer, {
        metadata: {
            contentType: mimeType,
            cacheControl: "public, max-age=31536000", // 1 year cache
        },
    });

    // Generate a signed URL for access (valid for 7 days)
    // Note: You may want to implement URL refresh logic for longer-term storage
    const gcsUrl = await generateReadSignedUrl(gcsPath, 7);

    return {
        gcsUrl,
        gcsBucket: BUCKET_NAME,
        gcsPath,
        size: buffer.length,
        mimeType,
    };
}

/**
 * Upload an image from a URL (used for DALL-E generated images)
 */
export async function uploadImageFromUrl(
    imageUrl: string,
    options: Omit<UploadOptions, "buffer">
): Promise<UploadResult> {
    const { userId, fileName, mimeType } = options;

    // Fetch the image from the URL
    const response = await fetch(imageUrl);

    if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return uploadImageToGCS({
        userId,
        fileName,
        mimeType,
        buffer,
    });
}

/**
 * Delete an image from Google Cloud Storage
 */
export async function deleteImageFromGCS(gcsPath: string): Promise<void> {
    const storage = getStorageClient();
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(gcsPath);

    try {
        await file.delete();
    } catch (error: any) {
        // Ignore 404 errors (file already deleted)
        if (error.code !== 404) {
            throw error;
        }
    }
}

/**
 * Generate a fresh signed URL for an existing file
 * Use this to refresh URLs that are about to expire
 */
export async function refreshSignedUrl(
    gcsPath: string,
    expiresInDays: number = 7
): Promise<string> {
    return generateReadSignedUrl(gcsPath, expiresInDays);
}

/**
 * Check if a file exists in GCS
 */
export async function fileExistsInGCS(gcsPath: string): Promise<boolean> {
    const storage = getStorageClient();
    const bucket = storage.bucket(BUCKET_NAME);
    const file = bucket.file(gcsPath);

    const [exists] = await file.exists();
    return exists;
}

/**
 * Get a fresh URL for an image
 * This should be called when displaying images to ensure the URL is valid
 */
export async function getImageUrl(gcsPath: string): Promise<string> {
    return generateReadSignedUrl(gcsPath, 7);
}