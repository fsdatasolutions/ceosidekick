// src/lib/document-processor.ts
// Document processing pipeline for CEO Sidekick Knowledge Base

import { db } from "@/db";
import { documents, documentChunks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { chunkDocument, getChunkStats } from "./chunking";
import { generateEmbeddings, estimateTokenCount } from "./embeddings";
import { uploadFile, deleteFile, downloadFile } from "./storage";

export interface ProcessingResult {
  success: boolean;
  documentId: string;
  chunkCount?: number;
  error?: string;
}

/**
 * Extract text from various file types
 * For MVP: TXT and MD only
 * TODO: Add PDF and DOCX support
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  // Plain text and markdown
  if (
    mimeType === "text/plain" ||
    mimeType === "text/markdown" ||
    mimeType === "text/x-markdown"
  ) {
    return buffer.toString("utf-8");
  }

  // TODO: PDF extraction
  // if (mimeType === "application/pdf") {
  //   const pdfParse = await import("pdf-parse");
  //   const data = await pdfParse.default(buffer);
  //   return data.text;
  // }

  // TODO: DOCX extraction
  // if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
  //   const mammoth = await import("mammoth");
  //   const result = await mammoth.extractRawText({ buffer });
  //   return result.value;
  // }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

/**
 * Process a document: extract text, chunk, embed, and store
 * This is the main pipeline that runs after upload
 */
export async function processDocument(documentId: string): Promise<ProcessingResult> {
  try {
    // Update status to processing
    await db
      .update(documents)
      .set({ status: "processing", updatedAt: new Date() })
      .where(eq(documents.id, documentId));

    // Get document details
    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId));

    if (!doc) {
      throw new Error("Document not found");
    }

    // Download file from storage
    if (!doc.storageKey) {
      throw new Error("Document has no storage key");
    }
    const fileBuffer = await downloadFile(doc.storageKey);

    // Extract text
    const text = await extractText(fileBuffer, doc.type);
    if (!text || text.trim().length === 0) {
      throw new Error("No text content extracted from document");
    }

    // Chunk the text
    const chunks = chunkDocument(text, doc.type);
    const stats = getChunkStats(chunks);

    if (chunks.length === 0) {
      throw new Error("Document produced no chunks");
    }

    console.log(
      `Processing ${doc.name}: ${chunks.length} chunks, ${stats.totalTokens} tokens`
    );

    // Generate embeddings for all chunks (batched)
    const chunkTexts = chunks.map((c) => c.content);
    const embeddings = await generateEmbeddings(chunkTexts);

    // Delete existing chunks (in case of reprocessing)
    await db
      .delete(documentChunks)
      .where(eq(documentChunks.documentId, documentId));

    // Insert chunks with embeddings
    const chunkInserts = chunks.map((chunk, index) => ({
      documentId,
      content: chunk.content,
      chunkIndex: chunk.index,
      tokenCount: chunk.tokenCount,
      embedding: embeddings[index],
      metadata: chunk.metadata,
    }));

    await db.insert(documentChunks).values(chunkInserts);

    // Update document status
    await db
      .update(documents)
      .set({
        status: "ready",
        chunkCount: chunks.length,
        processedAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          ...(doc.metadata as object || {}),
          totalTokens: stats.totalTokens,
          avgChunkSize: stats.avgTokensPerChunk,
          textLength: text.length,
        },
      })
      .where(eq(documents.id, documentId));

    return {
      success: true,
      documentId,
      chunkCount: chunks.length,
    };
  } catch (error) {
    // Update status to failed
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    
    await db
      .update(documents)
      .set({
        status: "failed",
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));

    console.error(`Failed to process document ${documentId}:`, error);

    return {
      success: false,
      documentId,
      error: errorMessage,
    };
  }
}

/**
 * Delete a document and all its chunks
 */
export async function deleteDocument(documentId: string): Promise<void> {
  // Get document to find storage key
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId));

  if (!doc) {
    throw new Error("Document not found");
  }

  // Delete from storage
  if (doc.storageKey) {
    await deleteFile(doc.storageKey);
  }

  // Delete chunks (cascade should handle this, but be explicit)
  await db
    .delete(documentChunks)
    .where(eq(documentChunks.documentId, documentId));

  // Delete document
  await db.delete(documents).where(eq(documents.id, documentId));
}

/**
 * Reprocess a failed document
 */
export async function reprocessDocument(documentId: string): Promise<ProcessingResult> {
  // Reset status
  await db
    .update(documents)
    .set({
      status: "pending",
      errorMessage: null,
      updatedAt: new Date(),
    })
    .where(eq(documents.id, documentId));

  return processDocument(documentId);
}

/**
 * Get supported MIME types
 */
export function getSupportedMimeTypes(): string[] {
  return [
    "text/plain",
    "text/markdown",
    "text/x-markdown",
    // Future:
    // "application/pdf",
    // "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
}

/**
 * Check if a MIME type is supported
 */
export function isSupportedMimeType(mimeType: string): boolean {
  return getSupportedMimeTypes().includes(mimeType);
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMime(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "text/plain": "txt",
    "text/markdown": "md",
    "text/x-markdown": "md",
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  };
  return mimeToExt[mimeType] || "txt";
}
