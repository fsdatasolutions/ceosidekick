// src/app/api/templates/save-to-knowledge-base/route.ts
// Save generated template documents to the user's knowledge base via GCS
// Then process for RAG (chunking + embeddings)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { documents } from "@/db/schema";
import { getUserUsage } from "@/lib/usage";
import { generateStorageKey, uploadFile } from "@/lib/storage";
import { processDocument } from "@/lib/document-processor";

// File type to MIME type mapping
const MIME_TYPES: Record<string, string> = {
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    pdf: "application/pdf",
};

// File types that can be processed for RAG (text extraction + embeddings)
const RAG_PROCESSABLE_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
];

function canProcessForRAG(mimeType: string): boolean {
    return RAG_PROCESSABLE_TYPES.includes(mimeType);
}

export async function POST(request: NextRequest) {
    try {
        // 1. Verify authentication
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // 2. Check if user is on paid tier
        const usage = await getUserUsage(session.user.id);
        if (usage.tier === "free") {
            return NextResponse.json(
                { error: "Knowledge base requires a paid subscription" },
                { status: 403 }
            );
        }

        // 3. Parse the form data
        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const source = formData.get("source") as string | null;
        const templateId = formData.get("templateId") as string | null;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        // 4. Get file details
        const fileName = file.name;
        const fileExtension = fileName.split(".").pop()?.toLowerCase() || "";
        const fileType = MIME_TYPES[fileExtension] || file.type;
        const fileSize = file.size;

        // 5. Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 6. Generate storage key and upload to GCS
        const storageKey = generateStorageKey(session.user.id, fileName);

        try {
            await uploadFile(buffer, storageKey, fileType);
        } catch (uploadError) {
            console.error("[Save to KB] GCS upload failed:", uploadError);
            return NextResponse.json(
                { error: "Failed to upload file to storage" },
                { status: 500 }
            );
        }

        // 7. Determine if this file type can be processed for RAG
        const isProcessable = canProcessForRAG(fileType);

        // 8. Create document record in database
        const [newDocument] = await db
            .insert(documents)
            .values({
                userId: session.user.id,
                name: fileName,
                originalName: fileName,
                type: fileType,
                size: fileSize,
                storageKey: storageKey,
                // If not processable (xlsx, pptx), mark as ready immediately
                // If processable (pdf, docx), mark as pending for processing
                status: isProcessable ? "pending" : "ready",
                chunkCount: 0,
                processedAt: isProcessable ? undefined : new Date(),
                metadata: {
                    source: source || "template-generator",
                    templateId: templateId,
                    generatedAt: new Date().toISOString(),
                    ragEnabled: isProcessable,
                },
            })
            .returning();

        console.log("[Save to KB] Document created:", newDocument.id, newDocument.name, "RAG:", isProcessable);

        // 9. Process document for RAG if supported (extract text, chunk, generate embeddings)
        if (isProcessable) {
            try {
                console.log("[Save to KB] Starting document processing...");
                const result = await processDocument(newDocument.id);

                if (!result.success) {
                    console.error("[Save to KB] Processing failed:", result.error);
                    // Document is saved but processing failed - user can retry later
                } else {
                    console.log("[Save to KB] Processing complete:", result.chunkCount, "chunks");
                }
            } catch (processError) {
                console.error("[Save to KB] Processing error:", processError);
                // Don't fail the request - document is saved, can be reprocessed
            }
        } else {
            console.log("[Save to KB] Skipping RAG processing for", fileType);
        }

        return NextResponse.json({
            success: true,
            document: {
                id: newDocument.id,
                name: newDocument.name,
                type: newDocument.type,
                size: newDocument.size,
                createdAt: newDocument.createdAt,
            },
        });
    } catch (error) {
        console.error("[Save to Knowledge Base] Error:", error);
        return NextResponse.json(
            { error: "Failed to save document to knowledge base" },
            { status: 500 }
        );
    }
}