// src/lib/vector-search.ts
// Hybrid search: Vector similarity + Keyword matching for CEO Sidekick Knowledge Base

import { sql } from "drizzle-orm";
import { generateEmbedding } from "./embeddings";
import { RAG_CONFIG, normalizeRAGOptions } from "./rag-config";

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
  matchType?: 'semantic' | 'keyword' | 'hybrid';
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
  keyword_rank?: string | number | null;
}

interface DocumentSearchRow {
  id: string;
  name: string;
  name_similarity: string | number;
}

/**
 * Extract meaningful search terms from a query
 * Removes common words and keeps significant terms
 */
function extractSearchTerms(query: string): string[] {
  const stopWords = new Set([
    'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'could',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'her', 'its', 'our', 'their',
    'this', 'that', 'these', 'those',
    'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
    'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'not', 'only', 'same', 'so', 'than', 'too', 'very',
    'just', 'about', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under',
    'again', 'further', 'then', 'once', 'here', 'there', 'and', 'but', 'or',
    'give', 'tell', 'show', 'find', 'get', 'make', 'know', 'think', 'see', 'come', 'go',
    'want', 'use', 'say', 'ask', 'need', 'try', 'let', 'put', 'take', 'help',
    'please', 'can', 'could', 'would', 'describe', 'explain', 'summary', 'summarize',
    'document', 'file', 'information', 'details', 'content'
  ]);

  return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')  // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Create a PostgreSQL tsquery from search terms
 */
function createTsQuery(terms: string[]): string {
  if (terms.length === 0) return '';
  // Use prefix matching (:*) for partial word matches
  return terms.map(term => `${term}:*`).join(' | ');
}

/**
 * Search for similar documents using HYBRID search
 * Combines: 1) Document name matching, 2) Keyword search, 3) Vector similarity
 */
export async function searchDocuments(
    query: string,
    userId: string,
    organizationId?: string,
    options: SearchOptions = {}
): Promise<SearchResult[]> {
  const opts = normalizeRAGOptions(options);

  const db = await getDb();
  if (!db) {
    console.log("[Search] No database available");
    return [];
  }

  if (!process.env.OPENAI_API_KEY) {
    console.log("[Search] OPENAI_API_KEY not configured");
    return [];
  }

  try {
    console.log("[Search] Generating embedding for query:", query.slice(0, 50));
    const queryEmbedding = await generateEmbedding(query);
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    // Extract search terms for keyword matching
    const searchTerms = extractSearchTerms(query);
    const tsQuery = createTsQuery(searchTerms);
    console.log("[Search] Extracted keywords:", searchTerms.slice(0, 5).join(", "));

    // Get accessible document IDs
    let accessibleDocs;
    if (organizationId) {
      accessibleDocs = await db.execute(sql`
        SELECT id FROM documents 
        WHERE status = 'ready' 
        AND ((user_id = ${userId} AND organization_id IS NULL) 
             OR organization_id = ${organizationId})
      `);
    } else {
      accessibleDocs = await db.execute(sql`
        SELECT id FROM documents 
        WHERE status = 'ready' AND user_id = ${userId}
      `);
    }

    const docIds = (accessibleDocs as unknown as DocumentIdRow[]).map((d) => d.id);

    if (docIds.length === 0) {
      console.log("[Search] No accessible documents found");
      return [];
    }

    console.log("[Search] Searching across", docIds.length, "documents");
    const docIdsArrayLiteral = `{${docIds.join(",")}}`;

    // ============================================
    // STEP 1: Check for document NAME matches
    // This catches searches like "show me the FSDS document"
    // ============================================
    const documentNameResults: SearchResult[] = [];

    if (searchTerms.length > 0) {
      const nameSearchPattern = `%${searchTerms.join('%')}%`;

      const docNameMatches = await db.execute(sql`
        SELECT DISTINCT
          d.id,
          d.name,
          CASE 
            WHEN LOWER(d.name) LIKE LOWER(${nameSearchPattern}) THEN 0.95
            WHEN LOWER(d.name) LIKE ANY(ARRAY[${sql.raw(searchTerms.map(t => `'%${t}%'`).join(','))}]) THEN 0.85
            ELSE 0.7
          END as name_similarity
        FROM documents d
        WHERE d.id = ANY(${docIdsArrayLiteral}::uuid[])
          AND (
            LOWER(d.name) LIKE LOWER(${nameSearchPattern})
            OR LOWER(d.name) LIKE ANY(ARRAY[${sql.raw(searchTerms.map(t => `'%${t}%'`).join(','))}])
          )
        LIMIT 3
      `);

      const nameMatches = docNameMatches as unknown as DocumentSearchRow[];

      if (nameMatches.length > 0) {
        console.log("[Search] Found", nameMatches.length, "document name matches");

        // Get the first chunk of each matching document
        for (const doc of nameMatches) {
          const firstChunk = await db.execute(sql`
            SELECT 
              dc.id as chunk_id,
              dc.document_id,
              d.name as document_name,
              dc.content,
              dc.chunk_index,
              dc.metadata
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            WHERE dc.document_id = ${doc.id}::uuid
            ORDER BY dc.chunk_index
            LIMIT 1
          `);

          const chunk = (firstChunk as unknown as ChunkSearchRow[])[0];
          if (chunk) {
            const similarity = typeof doc.name_similarity === 'string'
                ? parseFloat(doc.name_similarity)
                : doc.name_similarity;

            documentNameResults.push({
              chunkId: chunk.chunk_id,
              documentId: chunk.document_id,
              documentName: chunk.document_name,
              content: chunk.content,
              similarity: similarity,
              chunkIndex: chunk.chunk_index,
              metadata: chunk.metadata,
              matchType: 'keyword'
            });
          }
        }
      }
    }

    // ============================================
    // STEP 2: Hybrid search on chunk content
    // Combines vector similarity with keyword matching
    // ============================================
    let contentResults: SearchResult[] = [];

    // Check chunk stats for debugging
    const chunkStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_chunks,
        COUNT(embedding) as chunks_with_embeddings
      FROM document_chunks 
      WHERE document_id = ANY(${docIdsArrayLiteral}::uuid[])
    `);
    const stats = (chunkStats as unknown as Array<{ total_chunks: string; chunks_with_embeddings: string }>)[0];
    console.log("[Search] Chunk stats - Total:", stats?.total_chunks, "With embeddings:", stats?.chunks_with_embeddings);

    if (tsQuery && searchTerms.length > 0) {
      // HYBRID: Combine vector similarity with full-text search
      console.log("[Search] Running hybrid search with keywords:", tsQuery);

      const hybridResults = await db.execute(sql`
        WITH vector_search AS (
          SELECT 
            dc.id as chunk_id,
            dc.document_id,
            d.name as document_name,
            dc.content,
            dc.chunk_index,
            dc.metadata,
            1 - (dc.embedding <=> ${embeddingStr}::vector) as vector_similarity
          FROM document_chunks dc
          JOIN documents d ON d.id = dc.document_id
          WHERE dc.document_id = ANY(${docIdsArrayLiteral}::uuid[])
            AND dc.embedding IS NOT NULL
        ),
        keyword_search AS (
          SELECT 
            dc.id as chunk_id,
            ts_rank_cd(to_tsvector('english', dc.content), to_tsquery('english', ${tsQuery})) as keyword_rank
          FROM document_chunks dc
          WHERE dc.document_id = ANY(${docIdsArrayLiteral}::uuid[])
            AND to_tsvector('english', dc.content) @@ to_tsquery('english', ${tsQuery})
        )
        SELECT 
          v.chunk_id,
          v.document_id,
          v.document_name,
          v.content,
          v.chunk_index,
          v.metadata,
          v.vector_similarity,
          k.keyword_rank,
          -- Hybrid score: boost vector similarity when keywords match
          CASE 
            WHEN k.keyword_rank IS NOT NULL THEN 
              GREATEST(v.vector_similarity, 0.5) + (COALESCE(k.keyword_rank, 0) * 0.3)
            ELSE 
              v.vector_similarity
          END as similarity
        FROM vector_search v
        LEFT JOIN keyword_search k ON v.chunk_id = k.chunk_id
        ORDER BY similarity DESC
        LIMIT ${opts.limit * 2}
      `);

      const rows = hybridResults as unknown as (ChunkSearchRow & { vector_similarity: string | number })[];

      contentResults = rows
          .filter(row => {
            const sim = typeof row.similarity === 'string' ? parseFloat(row.similarity) : row.similarity;
            return sim >= opts.threshold;
          })
          .slice(0, opts.limit)
          .map(row => ({
            chunkId: row.chunk_id,
            documentId: row.document_id,
            documentName: row.document_name,
            content: row.content,
            similarity: typeof row.similarity === 'string' ? parseFloat(row.similarity) : row.similarity,
            chunkIndex: row.chunk_index,
            metadata: row.metadata,
            matchType: row.keyword_rank ? 'hybrid' as const : 'semantic' as const
          }));

    } else {
      // Pure vector search (fallback when no good keywords)
      console.log("[Search] Running pure vector search (no keywords extracted)");

      const vectorResults = await db.execute(sql`
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

      const rows = vectorResults as unknown as ChunkSearchRow[];

      contentResults = rows
          .filter(row => {
            const sim = typeof row.similarity === 'string' ? parseFloat(row.similarity) : row.similarity;
            return sim >= opts.threshold;
          })
          .slice(0, opts.limit)
          .map(row => ({
            chunkId: row.chunk_id,
            documentId: row.document_id,
            documentName: row.document_name,
            content: row.content,
            similarity: typeof row.similarity === 'string' ? parseFloat(row.similarity) : row.similarity,
            chunkIndex: row.chunk_index,
            metadata: row.metadata,
            matchType: 'semantic' as const
          }));
    }

    // ============================================
    // STEP 3: Merge and deduplicate results
    // Prioritize: document name matches > hybrid > semantic
    // ============================================
    const seenChunks = new Set<string>();
    const finalResults: SearchResult[] = [];

    // Add document name matches first (highest priority)
    for (const result of documentNameResults) {
      if (!seenChunks.has(result.chunkId)) {
        seenChunks.add(result.chunkId);
        finalResults.push(result);
      }
    }

    // Add content matches
    for (const result of contentResults) {
      if (!seenChunks.has(result.chunkId) && finalResults.length < opts.limit) {
        seenChunks.add(result.chunkId);
        finalResults.push(result);
      }
    }

    console.log("[Search] Final results:", finalResults.length,
        "- Name matches:", documentNameResults.length,
        "- Content matches:", contentResults.length);

    return finalResults.slice(0, opts.limit);

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
  let tokenCount = 50;

  for (const result of results) {
    const matchLabel = result.matchType === 'keyword' ? ' [name match]' :
        result.matchType === 'hybrid' ? ' [keyword+semantic]' : '';
    const section = `### From "${result.documentName}"${matchLabel} (relevance: ${(result.similarity * 100).toFixed(0)}%)\n${result.content}\n\n`;
    const sectionTokens = Math.ceil(section.length / 4);

    if (tokenCount + sectionTokens > maxTokens) {
      break;
    }

    context += section;
    tokenCount += sectionTokens;
  }

  return context;
}