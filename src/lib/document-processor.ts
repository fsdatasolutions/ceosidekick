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

export interface ExtractionResult {
  text: string;
  metadata?: {
    pageCount?: number;
    warnings?: string[];
  };
}

/**
 * Extract text from various file types
 * Supports: TXT, MD, PDF, DOCX
 */
export async function extractText(
    buffer: Buffer,
    mimeType: string
): Promise<ExtractionResult> {
  // Plain text and markdown - direct conversion
  if (
      mimeType === "text/plain" ||
      mimeType === "text/markdown" ||
      mimeType === "text/x-markdown"
  ) {
    return { text: buffer.toString("utf-8") };
  }

  // PDF extraction using unpdf (works in Node.js/serverless)
  if (mimeType === "application/pdf") {
    try {
      const { extractText } = await import("unpdf");

      // unpdf requires a pure Uint8Array, not a Node.js Buffer
      // Buffer extends Uint8Array but unpdf explicitly rejects it
      const uint8Array = Uint8Array.from(buffer);
      const { text, totalPages } = await extractText(uint8Array);

      // unpdf returns text as string[] (one string per page), join them
      const fullText = Array.isArray(text) ? text.join("\n\n") : text;

      const warnings: string[] = [];

      // Check for potential OCR issues (scanned PDFs)
      if (totalPages > 0 && (!fullText || fullText.trim().length < 100)) {
        warnings.push(
            "PDF appears to contain mostly images or scanned content. Text extraction may be incomplete."
        );
      }

      return {
        text: cleanExtractedText(fullText || ""),
        metadata: {
          pageCount: totalPages,
          warnings: warnings.length > 0 ? warnings : undefined,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`PDF extraction failed: ${message}`);
    }
  }

  // DOCX extraction
  if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });

      const warnings: string[] = [];
      if (result.messages && result.messages.length > 0) {
        // Collect any warnings from mammoth
        for (const msg of result.messages) {
          if (msg.type === "warning") {
            warnings.push(msg.message);
          }
        }
      }

      return {
        text: cleanExtractedText(result.value),
        metadata: {
          warnings: warnings.length > 0 ? warnings : undefined,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`DOCX extraction failed: ${message}`);
    }
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

/**
 * Clean up extracted text
 * Normalizes whitespace and removes problematic characters
 */
function cleanExtractedText(text: string): string {
  return text
      // Normalize line endings
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      // Remove null bytes and other control characters (except newlines/tabs)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      // Normalize multiple spaces (but preserve intentional indentation)
      .replace(/[^\S\n]+/g, " ")
      // Normalize multiple newlines (max 2)
      .replace(/\n{3,}/g, "\n\n")
      // Trim each line
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      // Final trim
      .trim();
}

/**
 * Process a document: extract text, chunk, embed, and store
 * This is the main pipeline that runs after upload
 */
export async function processDocument(
    documentId: string
): Promise<ProcessingResult> {
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
    const extraction = await extractText(fileBuffer, doc.type);
    const text = extraction.text;

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
            ...((doc.metadata as object) || {}),
            totalTokens: stats.totalTokens,
            avgChunkSize: stats.avgTokensPerChunk,
            textLength: text.length,
            pageCount: extraction.metadata?.pageCount,
            extractionWarnings: extraction.metadata?.warnings,
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
export async function reprocessDocument(
    documentId: string
): Promise<ProcessingResult> {
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
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
  };
  return mimeToExt[mimeType] || "txt";
}

/**
 * Get human-readable format name
 */
export function getFormatName(mimeType: string): string {
  const mimeToName: Record<string, string> = {
    "text/plain": "Plain Text",
    "text/markdown": "Markdown",
    "text/x-markdown": "Markdown",
    "application/pdf": "PDF",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "Word Document",
  };
  return mimeToName[mimeType] || "Unknown";
}