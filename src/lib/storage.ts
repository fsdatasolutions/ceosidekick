// src/lib/storage.ts
// Google Cloud Storage utilities for CEO Sidekick Knowledge Base

import { Storage } from "@google-cloud/storage";

// Initialize GCS client
// Uses Application Default Credentials or service account key
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  // If using JSON key directly (for Render/Vercel deployments):
  ...(process.env.GCS_CREDENTIALS && {
    credentials: JSON.parse(process.env.GCS_CREDENTIALS),
  }),
});

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || "ceosidekick-documents";

/**
 * Get the GCS bucket instance
 */
function getBucket() {
  return storage.bucket(BUCKET_NAME);
}

/**
 * Generate a unique storage key for a document
 * Format: users/{userId}/{timestamp}-{sanitizedFilename}
 * Or: orgs/{orgId}/{timestamp}-{sanitizedFilename} for shared docs
 */
export function generateStorageKey(
  userId: string,
  filename: string,
  organizationId?: string
): string {
  const timestamp = Date.now();
  const sanitizedName = filename
    .replace(/[^a-zA-Z0-9.-]/g, "_")
    .substring(0, 100); // Limit length

  if (organizationId) {
    return `orgs/${organizationId}/${timestamp}-${sanitizedName}`;
  }
  return `users/${userId}/${timestamp}-${sanitizedName}`;
}

/**
 * Upload a file to GCS
 * Returns the storage key
 */
export async function uploadFile(
  buffer: Buffer,
  storageKey: string,
  contentType: string
): Promise<string> {
  const bucket = getBucket();
  const file = bucket.file(storageKey);

  await file.save(buffer, {
    contentType,
    metadata: {
      cacheControl: "private, max-age=31536000", // 1 year cache for private files
    },
  });

  return storageKey;
}

/**
 * Download a file from GCS
 * Returns the file contents as a Buffer
 */
export async function downloadFile(storageKey: string): Promise<Buffer> {
  const bucket = getBucket();
  const file = bucket.file(storageKey);

  const [contents] = await file.download();
  return contents;
}

/**
 * Delete a file from GCS
 */
export async function deleteFile(storageKey: string): Promise<void> {
  const bucket = getBucket();
  const file = bucket.file(storageKey);

  await file.delete({ ignoreNotFound: true });
}

/**
 * Generate a signed URL for temporary access
 * Useful for giving users temporary download access
 */
export async function getSignedUrl(
  storageKey: string,
  expiresInMinutes: number = 60
): Promise<string> {
  const bucket = getBucket();
  const file = bucket.file(storageKey);

  const [url] = await file.getSignedUrl({
    action: "read",
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });

  return url;
}

/**
 * Check if a file exists in GCS
 */
export async function fileExists(storageKey: string): Promise<boolean> {
  const bucket = getBucket();
  const file = bucket.file(storageKey);

  const [exists] = await file.exists();
  return exists;
}

/**
 * Get file metadata from GCS
 */
export async function getFileMetadata(storageKey: string): Promise<{
  size: number;
  contentType: string;
  created: Date;
}> {
  const bucket = getBucket();
  const file = bucket.file(storageKey);

  const [metadata] = await file.getMetadata();

  return {
    size: parseInt(metadata.size as string, 10),
    contentType: metadata.contentType as string,
    created: new Date(metadata.timeCreated as string),
  };
}

/**
 * List all files for a user or organization
 */
export async function listFiles(
  prefix: string
): Promise<{ name: string; size: number }[]> {
  const bucket = getBucket();
  const [files] = await bucket.getFiles({ prefix });

  return files.map((file) => ({
    name: file.name,
    size: parseInt(file.metadata.size as string, 10),
  }));
}

// Export bucket name for reference
export { BUCKET_NAME };
