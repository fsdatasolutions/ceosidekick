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

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Supported MIME types (TXT and MD for MVP)
const SUPPORTED_MIME_TYPES = [
  "text/plain",
  "text/markdown",
  "text/x-markdown",
];

function isSupportedMimeType(mimeType: string): boolean {
  // Also accept empty or generic types for .txt and .md files
  if (SUPPORTED_MIME_TYPES.includes(mimeType)) return true;
  // Some browsers send application/octet-stream for text files
  return false;
}

function getMimeTypeFromFilename(filename: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'txt': return 'text/plain';
    case 'md': return 'text/markdown';
    default: return null;
  }
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
        message: "Database not configured"
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
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const orgId = (session.user as { organizationId?: string }).organizationId;

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const shared = formData.get("shared") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
          { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
          { status: 400 }
      );
    }

    // Determine MIME type (use filename if browser sends generic type)
    let mimeType = file.type;
    if (!isSupportedMimeType(mimeType)) {
      const inferredType = getMimeTypeFromFilename(file.name);
      if (inferredType) {
        mimeType = inferredType;
      } else {
        return NextResponse.json(
            {
              error: `Unsupported file type: ${file.type || 'unknown'}. Supported: TXT, MD`,
              supportedTypes: SUPPORTED_MIME_TYPES,
            },
            { status: 400 }
        );
      }
    }

    const db = await getDb();
    if (!db) {
      return NextResponse.json(
          { error: "Database not configured" },
          { status: 500 }
      );
    }

    const { documents } = await getSchema();

    // Read file content
    const buffer = Buffer.from(await file.arrayBuffer());
    const textContent = buffer.toString("utf-8");

    // Create document record
    const [doc] = await db
        .insert(documents)
        .values({
          userId,
          organizationId: shared && orgId ? orgId : null,
          name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          originalName: file.name,
          type: mimeType,
          size: file.size,
          status: "pending",
          metadata: { textLength: textContent.length },
        })
        .returning();

    // Process document in background
    processDocumentAsync(doc.id, textContent, mimeType).catch((err) => {
      console.error("Background processing failed:", err);
    });

    return NextResponse.json({
      document: {
        id: doc.id,
        name: doc.name,
        status: doc.status,
        size: doc.size,
      },
      message: "Document uploaded and processing started",
    });
  } catch (error) {
    console.error("Error uploading document:", error);
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
      return NextResponse.json(
          { error: "Document not found" },
          { status: 404 }
      );
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
// Background Processing (inline for MVP)
// ============================================

async function processDocumentAsync(
    documentId: string,
    textContent: string,
    mimeType: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const { documents, documentChunks } = await getSchema();

  try {
    // Update status to processing
    await db
        .update(documents)
        .set({ status: "processing", updatedAt: new Date() })
        .where(eq(documents.id, documentId));

    // Chunk the text
    const chunks = chunkText(textContent);
    console.log(`[Process] Document ${documentId}: ${chunks.length} chunks`);

    if (chunks.length === 0) {
      throw new Error("Document produced no chunks");
    }

    // Generate embeddings with OpenAI
    let embeddings: number[][] | null = null;
    if (process.env.OPENAI_API_KEY) {
      try {
        const { generateEmbeddings } = await import("@/lib/embeddings");
        embeddings = await generateEmbeddings(chunks.map(c => c.content));
        console.log(`[Process] Generated ${embeddings.length} embeddings`);
      } catch (err) {
        console.error("[Process] Embedding generation failed:", err);
        // Continue without embeddings - document will be stored but not searchable
      }
    } else {
      console.log("[Process] OPENAI_API_KEY not set, skipping embeddings");
    }

    // Insert chunks with embeddings
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      await db.insert(documentChunks).values({
        documentId,
        content: chunk.content,
        chunkIndex: chunk.index,
        tokenCount: chunk.tokenCount,
        metadata: chunk.metadata,
      });

      // Update with embedding if available (separate query to handle vector type)
      if (embeddings && embeddings[i]) {
        const embeddingStr = `[${embeddings[i].join(",")}]`;
        await db.execute(
            sql`UPDATE document_chunks 
              SET embedding = ${embeddingStr}::vector 
              WHERE document_id = ${documentId} AND chunk_index = ${chunk.index}`
        );
      }
    }

    // Update document status
    await db
        .update(documents)
        .set({
          status: "ready",
          chunkCount: chunks.length,
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(documents.id, documentId));

    console.log(`[Process] Document ${documentId} ready`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Process] Failed for ${documentId}:`, error);

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
        endPos = Math.max(0, endPos - 200) + sentMatch.index + sentMatch[0].length;
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