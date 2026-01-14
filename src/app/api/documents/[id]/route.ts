// src/app/api/documents/[id]/route.ts
// Individual document operations API

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// Lazy database imports
async function getDb() {
  if (!process.env.DATABASE_URL) return null;
  const { db } = await import("@/db");
  return db;
}

async function getSchema() {
  const { documents, documentChunks } = await import("@/db/schema");
  return { documents, documentChunks };
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/documents/[id]
 * Get document details including chunks
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: documentId } = await params;

    const db = await getDb();
    if (!db) {
      return NextResponse.json(
          { error: "Database not configured" },
          { status: 500 }
      );
    }

    const { documents, documentChunks } = await getSchema();

    // Get document
    const [doc] = await db
        .select()
        .from(documents)
        .where(eq(documents.id, documentId));

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Check access permission
    const orgId = (session.user as { organizationId?: string }).organizationId;
    const hasAccess =
        doc.userId === userId ||
        (doc.organizationId && orgId === doc.organizationId);

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get chunks
    const chunks = await db
        .select({
          id: documentChunks.id,
          content: documentChunks.content,
          chunkIndex: documentChunks.chunkIndex,
          tokenCount: documentChunks.tokenCount,
          metadata: documentChunks.metadata,
        })
        .from(documentChunks)
        .where(eq(documentChunks.documentId, documentId))
        .orderBy(documentChunks.chunkIndex);

    return NextResponse.json({
      document: {
        id: doc.id,
        name: doc.name,
        originalName: doc.originalName,
        type: doc.type,
        size: doc.size,
        status: doc.status,
        chunkCount: doc.chunkCount,
        errorMessage: doc.errorMessage,
        metadata: doc.metadata,
        createdAt: doc.createdAt,
        processedAt: doc.processedAt,
      },
      chunks,
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
        { error: "Failed to fetch document" },
        { status: 500 }
    );
  }
}

/**
 * POST /api/documents/[id]
 * Reprocess a failed document
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: documentId } = await params;

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
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete existing chunks
    await db
        .delete(documentChunks)
        .where(eq(documentChunks.documentId, documentId));

    // Reset status
    await db
        .update(documents)
        .set({
          status: "pending",
          errorMessage: null,
          chunkCount: 0,
          updatedAt: new Date(),
        })
        .where(eq(documents.id, documentId));

    // For reprocessing, we need the original text content
    // Since we're not storing files yet, return a message
    // TODO: Implement full reprocessing with GCS storage

    return NextResponse.json({
      success: true,
      message: "Document reset. Please re-upload to process again.",
    });
  } catch (error) {
    console.error("Error reprocessing document:", error);
    return NextResponse.json(
        { error: "Failed to reprocess document" },
        { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents/[id]
 * Delete a document
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: documentId } = await params;

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
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Delete chunks
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