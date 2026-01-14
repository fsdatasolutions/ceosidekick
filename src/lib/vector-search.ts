// src/lib/vector-search.ts
// Vector similarity search for CEO Sidekick Knowledge Base

import { sql } from "drizzle-orm";
import { generateEmbedding } from "./embeddings";

// Lazy database import
async function getDb() {
  if (!process.env.DATABASE_URL) return null;
  const { db } = await import("@/db");
  return db;
}

export interface SearchResult {
  chunkId: string;
  documentId: string;
  documentName: string;
  content: string;
  similarity: number;
  chunkIndex: number;
  metadata: Record<string, unknown> | null;
}

export interface SearchOptions {
  limit?: number;
  threshold?: number;
}

// Database row types for raw SQL queries
interface DocumentIdRow {
  id: string;
}

interface ChunkSearchRow {
  chunk_id: string;
  document_id: string;
  document_name: string;
  content: string;
  chunk_index: number;
  metadata: Record<string, unknown> | null;
  similarity: string | number;
}

const DEFAULT_OPTIONS: Required<SearchOptions> = {
  limit: 5,
  threshold: 0.4, // Lowered to 0.4 to ensure matches
};

/**
 * Search for similar documents using vector similarity
 */
export async function searchDocuments(
    query: string,
    userId: string,
    organizationId?: string,
    options: SearchOptions = {}
): Promise<SearchResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const db = await getDb();
  if (!db) {
    console.log("[Search] No database available");
    return [];
  }

  // Check if OpenAI is configured
  if (!process.env.OPENAI_API_KEY) {
    console.log("[Search] OPENAI_API_KEY not configured");
    return [];
  }

  try {
    // Generate embedding for the search query
    console.log("[Search] Generating embedding for query:", query.slice(0, 50));
    const queryEmbedding = await generateEmbedding(query);
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    // First get document IDs the user can access
    let accessibleDocs;
    if (organizationId) {
      // User has org - search both private and org docs
      accessibleDocs = await db.execute(sql`
        SELECT id FROM documents
        WHERE status = 'ready'
          AND ((user_id = ${userId} AND organization_id IS NULL)
          OR organization_id = ${organizationId})
      `);
    } else {
      // No org - only user's private docs
      accessibleDocs = await db.execute(sql`
        SELECT id FROM documents
        WHERE status = 'ready' AND user_id = ${userId}
      `);
    }

    // Drizzle execute() returns RowList directly, not { rows: [] }
    const docIds = (accessibleDocs as unknown as DocumentIdRow[]).map((d) => d.id);

    if (docIds.length === 0) {
      console.log("[Search] No accessible documents found");
      return [];
    }

    console.log("[Search] Searching across", docIds.length, "documents");

    // Format docIds as PostgreSQL array literal: {uuid1,uuid2,...}
    const docIdsArrayLiteral = `{${docIds.join(",")}}`;

    // Debug: Check how many chunks exist and have embeddings
    const chunkStats = await db.execute(sql`
      SELECT
        COUNT(*) as total_chunks,
        COUNT(embedding) as chunks_with_embeddings
      FROM document_chunks
      WHERE document_id = ANY(${docIdsArrayLiteral}::uuid[])
    `);
    const stats = (chunkStats as unknown as Array<{ total_chunks: string; chunks_with_embeddings: string }>)[0];
    console.log("[Search] Chunk stats - Total:", stats?.total_chunks, "With embeddings:", stats?.chunks_with_embeddings);

    // Debug: Check similarity scores without threshold to see what we're getting
    if (stats?.chunks_with_embeddings && parseInt(stats.chunks_with_embeddings) > 0) {
      const debugSimilarity = await db.execute(sql`
        SELECT
          1 - (dc.embedding <=> ${embeddingStr}::vector) as similarity
        FROM document_chunks dc
        WHERE dc.document_id = ANY(${docIdsArrayLiteral}::uuid[])
          AND dc.embedding IS NOT NULL
        ORDER BY dc.embedding <=> ${embeddingStr}::vector
          LIMIT 3
      `);
      const topScores = (debugSimilarity as unknown as Array<{ similarity: string }>);
      console.log("[Search] Top similarity scores:", topScores.map(r => parseFloat(r.similarity).toFixed(3)));
    }

    console.log("[Search] Using threshold:", opts.threshold);

    // Search chunks with vector similarity using pgvector
    // Using cosine distance: 1 - (a <=> b) gives similarity
    // Note: Threshold filtering done in JavaScript for reliability
    const results = await db.execute(sql`
      SELECT
        dc.id as chunk_id,
        dc.document_id,
        d.name as document_name,
        dc.content,
        dc.chunk_index,
        dc.metadata,
        1 - (dc.embedding <=> ${embeddingStr}::vector) as similarity
      FROM document_chunks dc
             JOIN documents d ON d.id = dc.document_id
      WHERE dc.document_id = ANY(${docIdsArrayLiteral}::uuid[])
        AND dc.embedding IS NOT NULL
      ORDER BY dc.embedding <=> ${embeddingStr}::vector
        LIMIT ${opts.limit * 2}
    `);

    // Drizzle execute() returns RowList directly
    const resultRows = results as unknown as ChunkSearchRow[];

    // Filter by threshold in JavaScript for reliability
    const filteredRows = resultRows.filter(row => {
      const sim = typeof row.similarity === 'string' ? parseFloat(row.similarity) : row.similarity;
      return sim >= opts.threshold;
    }).slice(0, opts.limit);

    console.log("[Search] Found", resultRows.length, "chunks before threshold,", filteredRows.length, "after threshold filter");

    return filteredRows.map((row) => ({
      chunkId: row.chunk_id,
      documentId: row.document_id,
      documentName: row.document_name,
      content: row.content,
      similarity: typeof row.similarity === 'string' ? parseFloat(row.similarity) : row.similarity,
      chunkIndex: row.chunk_index,
      metadata: row.metadata,
    }));
  } catch (error) {
    console.error("[Search] Error:", error);
    return [];
  }
}

/**
 * Format search results for inclusion in LLM context
 */
export function formatResultsForContext(
    results: SearchResult[],
    maxTokens: number = 3000
): string {
  if (results.length === 0) {
    return "## Relevant Information from Documents\n\nNo relevant documents found in your knowledge base.";
  }

  let context = "## Relevant Information from Documents\n\n";
  let tokenCount = 50; // Buffer for header

  for (const result of results) {
    const section = `### From "${result.documentName}" (relevance: ${(result.similarity * 100).toFixed(0)}%)\n${result.content}\n\n`;
    const sectionTokens = Math.ceil(section.length / 4);

    if (tokenCount + sectionTokens > maxTokens) {
      break;
    }

    context += section;
    tokenCount += sectionTokens;
  }

  return context;
}