// src/app/api/documents/route.ts
// Document management API for CEO Sidekick Knowledge Base

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eq, desc, or, and, isNull, sql } from "drizzle-orm";

// Lazy database imports (matching your existing pattern)
async function getDb() {
  if (!process.env.DATABASE_URL) return null;
  const { db } = await import("@/db");
  return db;
}

async function getSchema() {
  const { documents, documentChunks } = await import("@/db/schema");
  return { documents, documentChunks };
}

// Max file size: 10MB (increase later for large file support)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Supported MIME types
const SUPPORTED_MIME_TYPES = [
  "text/plain",
  "text/markdown",
  "text/x-markdown",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Human-readable format names for error messages
const FORMAT_NAMES: Record<string, string> = {
  "text/plain": "TXT",
  "text/markdown": "MD",
  "text/x-markdown": "MD",
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
};

function isSupportedMimeType(mimeType: string): boolean {
  return SUPPORTED_MIME_TYPES.includes(mimeType);
}

function getMimeTypeFromFilename(filename: string): string | null {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "txt":
      return "text/plain";
    case "md":
      return "text/markdown";
    case "pdf":
      return "application/pdf";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    default:
      return null;
  }
}

function getSupportedFormatsString(): string {
  return "TXT, MD, PDF, DOCX";
}

/**
 * Check if MIME type is a text format (can be read as UTF-8)
 */
function isTextFormat(mimeType: string): boolean {
  return (
      mimeType === "text/plain" ||
      mimeType === "text/markdown" ||
      mimeType === "text/x-markdown"
  );
}

/**
 * GET /api/documents
 * List all documents for the current user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const orgId = (session.user as { organizationId?: string }).organizationId;

    const db = await getDb();
    if (!db) {
      return NextResponse.json({
        documents: [],
        supportedTypes: SUPPORTED_MIME_TYPES,
        supportedFormats: getSupportedFormatsString(),
        message: "Database not configured",
      });
    }

    const { documents } = await getSchema();

    // Get user's private docs + org shared docs
    let userDocs;
    if (orgId) {
      userDocs = await db
          .select({
            id: documents.id,
            name: documents.name,
            originalName: documents.originalName,
            type: documents.type,
            size: documents.size,
            status: documents.status,
            chunkCount: documents.chunkCount,
            errorMessage: documents.errorMessage,
            createdAt: documents.createdAt,
            processedAt: documents.processedAt,
            organizationId: documents.organizationId,
          })
          .from(documents)
          .where(
              or(
                  and(eq(documents.userId, userId), isNull(documents.organizationId)),
                  eq(documents.organizationId, orgId)
              )
          )
          .orderBy(desc(documents.createdAt));
    } else {
      userDocs = await db
          .select({
            id: documents.id,
            name: documents.name,
            originalName: documents.originalName,
            type: documents.type,
            size: documents.size,
            status: documents.status,
            chunkCount: documents.chunkCount,
            errorMessage: documents.errorMessage,
            createdAt: documents.createdAt,
            processedAt: documents.processedAt,
            organizationId: documents.organizationId,
          })
          .from(documents)
          .where(eq(documents.userId, userId))
          .orderBy(desc(documents.createdAt));
    }

    return NextResponse.json({
      documents: userDocs,
      supportedTypes: SUPPORTED_MIME_TYPES,
      supportedFormats: getSupportedFormatsString(),
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
    );
  }
}

/**
 * POST /api/documents
 * Upload a new document
 */
export async function POST(req: NextRequest) {
  console.log(`[Upload] Received upload request`);

  try {
    const session = await auth();
    if (!session?.user?.id) {
      console.log(`[Upload] Unauthorized - no session`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const orgId = (session.user as { organizationId?: string }).organizationId;
    console.log(`[Upload] User: ${userId}`);

    // Parse multipart form data
    console.log(`[Upload] Parsing form data...`);
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const shared = formData.get("shared") === "true";

    if (!file) {
      console.log(`[Upload] No file provided`);
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    console.log(`[Upload] File received:`, {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.log(`[Upload] File too large: ${file.size} > ${MAX_FILE_SIZE}`);
      return NextResponse.json(
          {
            error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          },
          { status: 400 }
      );
    }

    // Determine MIME type (use filename if browser sends generic type)
    let mimeType = file.type;
    console.log(`[Upload] Original MIME type: ${mimeType}`);

    if (!isSupportedMimeType(mimeType)) {
      const inferredType = getMimeTypeFromFilename(file.name);
      console.log(`[Upload] Inferred MIME type from filename: ${inferredType}`);
      if (inferredType) {
        mimeType = inferredType;
      } else {
        console.log(`[Upload] Unsupported file type`);
        return NextResponse.json(
            {
              error: `Unsupported file type: ${file.type || "unknown"}. Supported: ${getSupportedFormatsString()}`,
              supportedTypes: SUPPORTED_MIME_TYPES,
            },
            { status: 400 }
        );
      }
    }

    const db = await getDb();
    if (!db) {
      console.log(`[Upload] Database not configured`);
      return NextResponse.json(
          { error: "Database not configured" },
          { status: 500 }
      );
    }

    const { documents } = await getSchema();

    // Read file content as buffer FIRST (this is fast - file is already in memory)
    console.log(`[Upload] Reading file buffer...`);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log(`[Upload] Buffer created: ${buffer.length} bytes`);

    // Create document record - only include required fields
    // Let database handle defaults for optional columns
    console.log(`[Upload] Creating document record...`);
    const [doc] = await db
        .insert(documents)
        .values({
          userId,
          organizationId: shared && orgId ? orgId : undefined,
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          originalName: file.name,
          type: mimeType,
          size: file.size,
          status: "processing",
          metadata: {
            format: FORMAT_NAMES[mimeType] || "Unknown",
          },
        })
        .returning();

    console.log(`[Upload] Document record created: ${doc.id}`);

    // Process synchronously to avoid serverless termination issues
    // This ensures processing completes before the function exits
    // For very large files (future), implement job queue processing
    try {
      console.log(`[Upload] Starting synchronous processing...`);
      await processDocumentAsync(doc.id, buffer, mimeType);

      console.log(`[Upload] Processing complete, returning success`);
      return NextResponse.json({
        document: {
          id: doc.id,
          name: doc.name,
          status: "ready",
          size: doc.size,
          format: FORMAT_NAMES[mimeType],
        },
        message: "Document uploaded and processed successfully",
      });
    } catch (processingError) {
      // Processing failed but document exists - user can see the error
      const errorMessage = processingError instanceof Error ? processingError.message : "Unknown error";
      console.error("[Upload] Processing failed:", {
        documentId: doc.id,
        error: errorMessage,
      });

      return NextResponse.json({
        document: {
          id: doc.id,
          name: doc.name,
          status: "failed",
          size: doc.size,
          format: FORMAT_NAMES[mimeType],
        },
        message: "Document uploaded but processing failed. You can retry later.",
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("[Upload] Error uploading document:", {
      message: errorMessage,
      stack: errorStack?.split('\n').slice(0, 5).join('\n'),
    });
    return NextResponse.json(
        { error: "Failed to upload document" },
        { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents?id=xxx
 * Delete a document
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get("id");

    if (!documentId) {
      return NextResponse.json(
          { error: "Document ID required" },
          { status: 400 }
      );
    }

    const db = await getDb();
    if (!db) {
      return NextResponse.json(
          { error: "Database not configured" },
          { status: 500 }
      );
    }

    const { documents, documentChunks } = await getSchema();

    // Verify ownership
    const [doc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, documentId));

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    if (doc.userId !== userId) {
      return NextResponse.json(
          { error: "Not authorized to delete this document" },
          { status: 403 }
      );
    }

    // Delete chunks first (cascade should handle, but be explicit)
    await db
        .delete(documentChunks)
        .where(eq(documentChunks.documentId, documentId));

    // Delete document
    await db.delete(documents).where(eq(documents.id, documentId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
        { error: "Failed to delete document" },
        { status: 500 }
    );
  }
}

// ============================================
// Background Processing
// ============================================

interface ExtractionResult {
  text: string;
  metadata?: {
    pageCount?: number;
    warnings?: string[];
  };
}

/**
 * Extract text from document buffer based on MIME type
 */
async function extractTextFromBuffer(
    buffer: Buffer,
    mimeType: string
): Promise<ExtractionResult> {
  console.log(`[Extract] Starting extraction for ${mimeType}, buffer size: ${buffer.length} bytes`);

  // Plain text and markdown - direct UTF-8 conversion
  if (isTextFormat(mimeType)) {
    const text = buffer.toString("utf-8");
    console.log(`[Extract] Text file extracted: ${text.length} chars`);
    return { text };
  }

  // PDF extraction using unpdf (works in Node.js/serverless)
  if (mimeType === "application/pdf") {
    console.log(`[Extract] Starting PDF extraction with unpdf...`);
    try {
      const { extractText } = await import("unpdf");

      console.log(`[Extract] unpdf loaded, extracting text...`);

      // unpdf requires a pure Uint8Array, not a Node.js Buffer
      // Buffer extends Uint8Array but unpdf explicitly rejects it
      // Copy the data to a fresh Uint8Array
      const uint8Array = Uint8Array.from(buffer);
      console.log(`[Extract] Converted to Uint8Array: ${uint8Array.length} bytes, isBuffer: ${Buffer.isBuffer(uint8Array)}`);

      const { text, totalPages } = await extractText(uint8Array);

      // unpdf returns text as string[] (one string per page), join them
      const fullText = Array.isArray(text) ? text.join("\n\n") : text;

      console.log(`[Extract] PDF extracted successfully:`, {
        pages: totalPages,
        textLength: fullText?.length || 0,
      });

      const warnings: string[] = [];

      // Check for potential OCR issues (scanned PDFs)
      if (totalPages > 0 && (!fullText || fullText.trim().length < 100)) {
        console.log(`[Extract] Warning: PDF has ${totalPages} pages but only ${fullText?.trim().length || 0} chars of text`);
        warnings.push(
            "PDF appears to contain mostly images or scanned content. Text extraction may be incomplete."
        );
      }

      const cleanedText = cleanExtractedText(fullText || "");
      console.log(`[Extract] PDF text cleaned: ${cleanedText.length} chars`);

      return {
        text: cleanedText,
        metadata: {
          pageCount: totalPages,
          warnings: warnings.length > 0 ? warnings : undefined,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const stack = error instanceof Error ? error.stack : undefined;
      console.error(`[Extract] PDF extraction failed:`, {
        error: message,
        stack: stack?.split('\n').slice(0, 5).join('\n'),
        bufferSize: buffer.length,
        bufferStart: buffer.slice(0, 20).toString('hex'),
      });
      throw new Error(`PDF extraction failed: ${message}`);
    }
  }

  // DOCX extraction
  if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    console.log(`[Extract] Starting DOCX extraction...`);
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      console.log(`[Extract] DOCX extracted: ${result.value?.length || 0} chars, ${result.messages?.length || 0} messages`);

      const warnings: string[] = [];
      if (result.messages && result.messages.length > 0) {
        for (const msg of result.messages) {
          console.log(`[Extract] DOCX message: ${msg.type} - ${msg.message}`);
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
      console.error(`[Extract] DOCX extraction failed:`, message);
      throw new Error(`DOCX extraction failed: ${message}`);
    }
  }

  console.error(`[Extract] Unsupported file type: ${mimeType}`);
  throw new Error(`Unsupported file type: ${mimeType}`);
}

/**
 * Clean up extracted text
 */
function cleanExtractedText(text: string): string {
  return text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .replace(/[^\S\n]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .split("\n")
      .map((line) => line.trim())
      .join("\n")
      .trim();
}

async function processDocumentAsync(
    documentId: string,
    buffer: Buffer,
    mimeType: string
): Promise<void> {
  console.log(`[Process] Starting processing for document ${documentId}`);
  console.log(`[Process] Buffer size: ${buffer.length}, MIME type: ${mimeType}`);

  const db = await getDb();
  if (!db) {
    console.error(`[Process] No database connection`);
    return;
  }

  const { documents, documentChunks } = await getSchema();

  try {
    // Update status to processing
    await db
        .update(documents)
        .set({ status: "processing", updatedAt: new Date() })
        .where(eq(documents.id, documentId));

    console.log(`[Process] Extracting text from ${mimeType}...`);
    const extractStart = Date.now();

    // Extract text from buffer
    const extraction = await extractTextFromBuffer(buffer, mimeType);
    const textContent = extraction.text;

    console.log(
        `[Process] Extraction complete in ${Date.now() - extractStart}ms, ${textContent.length} chars`
    );

    if (!textContent || textContent.trim().length === 0) {
      throw new Error("No text content extracted from document");
    }

    // Chunk the text
    const chunkStart = Date.now();
    const chunks = chunkText(textContent);
    console.log(
        `[Process] Document ${documentId}: ${chunks.length} chunks in ${Date.now() - chunkStart}ms`
    );

    if (chunks.length === 0) {
      throw new Error("Document produced no chunks");
    }

    // Generate embeddings with OpenAI (batched internally)
    let embeddings: number[][] | null = null;
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log(`[Process] Generating embeddings for ${chunks.length} chunks...`);
        const embedStart = Date.now();
        const { generateEmbeddings } = await import("@/lib/embeddings");
        embeddings = await generateEmbeddings(chunks.map((c) => c.content));
        console.log(
            `[Process] Generated ${embeddings.length} embeddings in ${Date.now() - embedStart}ms`
        );
      } catch (err) {
        console.error("[Process] Embedding generation failed:", err);
        // Continue without embeddings - document will be stored but not searchable
      }
    } else {
      console.log("[Process] OPENAI_API_KEY not set, skipping embeddings");
    }

    // Delete any existing chunks (for reprocessing)
    console.log(`[Process] Deleting existing chunks for document ${documentId}...`);
    await db
        .delete(documentChunks)
        .where(eq(documentChunks.documentId, documentId));

    // BATCH INSERT: Insert chunks in batches for performance
    const BATCH_SIZE = 100;
    const insertStart = Date.now();
    console.log(`[Process] Inserting ${chunks.length} chunks in batches of ${BATCH_SIZE}...`);

    for (let batchStart = 0; batchStart < chunks.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, chunks.length);
      const batchChunks = chunks.slice(batchStart, batchEnd);

      // Prepare batch values
      const batchValues = batchChunks.map((chunk, idx) => ({
        documentId,
        content: chunk.content,
        chunkIndex: chunk.index,
        tokenCount: chunk.tokenCount,
        metadata: chunk.metadata,
      }));

      // Insert batch of chunks
      await db.insert(documentChunks).values(batchValues);

      // Update embeddings for this batch using a single raw SQL query
      if (embeddings) {
        const batchEmbeddings = embeddings.slice(batchStart, batchEnd);

        // Build CASE statement for batch embedding update
        const caseStatements = batchChunks
            .map((chunk, idx) => {
              const embedding = batchEmbeddings[idx];
              if (!embedding) return null;
              const embeddingStr = `[${embedding.join(",")}]`;
              return `WHEN ${chunk.index} THEN '${embeddingStr}'::vector`;
            })
            .filter(Boolean)
            .join(" ");

        if (caseStatements) {
          const chunkIndices = batchChunks.map((c) => c.index).join(",");
          await db.execute(
              sql`UPDATE document_chunks
                  SET embedding = CASE chunk_index ${sql.raw(caseStatements)} END
                  WHERE document_id = ${documentId}
                    AND chunk_index IN (${sql.raw(chunkIndices)})`
          );
        }
      }

      // Log progress for large documents
      if (chunks.length > BATCH_SIZE) {
        console.log(
            `[Process] Inserted batch ${Math.floor(batchStart / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)}`
        );
      }
    }

    console.log(
        `[Process] Inserted ${chunks.length} chunks in ${Date.now() - insertStart}ms`
    );

    // Update document status with extraction metadata
    await db
        .update(documents)
        .set({
          status: "ready",
          chunkCount: chunks.length,
          processedAt: new Date(),
          updatedAt: new Date(),
          metadata: {
            format: FORMAT_NAMES[mimeType],
            textLength: textContent.length,
            pageCount: extraction.metadata?.pageCount,
            extractionWarnings: extraction.metadata?.warnings,
          },
        })
        .where(eq(documents.id, documentId));

    console.log(`[Process] Document ${documentId} ready`);
  } catch (error) {
    const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error(`[Process] Failed for ${documentId}:`, {
      message: errorMessage,
      stack: errorStack?.split('\n').slice(0, 5).join('\n'),
    });

    await db
        .update(documents)
        .set({
          status: "failed",
          errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, documentId));
  }
}

// ============================================
// Simple Text Chunking (inline for MVP)
// ============================================

interface Chunk {
  content: string;
  index: number;
  tokenCount: number;
  metadata: { startChar: number; endChar: number };
}

function chunkText(text: string, chunkSize = 500, overlap = 50): Chunk[] {
  const cleanedText = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  if (!cleanedText) return [];

  const targetChars = chunkSize * 4; // ~4 chars per token
  const overlapChars = overlap * 4;
  const minChars = 100 * 4;

  const chunks: Chunk[] = [];
  let startPos = 0;
  let chunkIndex = 0;

  while (startPos < cleanedText.length) {
    let endPos = startPos + targetChars;

    // If near the end, take the rest
    if (endPos >= cleanedText.length - minChars) {
      const content = cleanedText.slice(startPos).trim();
      if (content.length >= minChars || chunks.length === 0) {
        chunks.push({
          content,
          index: chunkIndex,
          tokenCount: Math.ceil(content.length / 4),
          metadata: { startChar: startPos, endChar: cleanedText.length },
        });
      }
      break;
    }

    // Find natural break point
    const window = cleanedText.slice(
        Math.max(0, endPos - 200),
        Math.min(cleanedText.length, endPos + 200)
    );

    // Try paragraph break
    const paraMatch = window.match(/\n\n/);
    if (paraMatch && paraMatch.index !== undefined) {
      endPos = Math.max(0, endPos - 200) + paraMatch.index + 2;
    } else {
      // Try sentence break
      const sentMatch = window.match(/[.!?]\s+/);
      if (sentMatch && sentMatch.index !== undefined) {
        endPos =
            Math.max(0, endPos - 200) + sentMatch.index + sentMatch[0].length;
      }
    }

    const content = cleanedText.slice(startPos, endPos).trim();
    if (content.length >= minChars) {
      chunks.push({
        content,
        index: chunkIndex,
        tokenCount: Math.ceil(content.length / 4),
        metadata: { startChar: startPos, endChar: endPos },
      });
      chunkIndex++;
    }

    startPos = Math.max(startPos + 1, endPos - overlapChars);
  }

  return chunks;
}