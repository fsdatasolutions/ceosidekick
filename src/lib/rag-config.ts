// src/lib/rag-config.ts
// Centralized configuration for RAG (Retrieval-Augmented Generation)
//
// This is the SINGLE SOURCE OF TRUTH for RAG settings.
// Do not hardcode these values elsewhere - import from here.

export const RAG_CONFIG = {
    // Similarity threshold for vector search (0.0 - 1.0)
    // Typical semantic similarity scores range from 0.3-0.6 for relevant content
    // - 0.3: Very loose matching, may include some irrelevant results
    // - 0.4: Recommended default, good balance of recall and precision
    // - 0.5: Stricter matching, may miss some relevant results
    // - 0.7+: Too strict for most semantic search use cases
    DEFAULT_THRESHOLD: 0.7,

    // Minimum allowed threshold (prevents overly loose searches)
    MIN_THRESHOLD: 0.3,

    // Maximum allowed threshold (prevents filtering out everything)
    MAX_THRESHOLD: 0.95,

    // Default number of chunks to retrieve
    DEFAULT_LIMIT: 5,

    // Maximum chunks a user can request
    MAX_LIMIT: 20,

    // Maximum tokens to include in context
    DEFAULT_MAX_CONTEXT_TOKENS: 3000,
} as const;

// Type for RAG options
export interface RAGOptions {
    limit?: number;
    threshold?: number;
    maxContextTokens?: number;
}

// Helper to normalize RAG options with defaults and bounds
export function normalizeRAGOptions(options: RAGOptions = {}): Required<RAGOptions> {
    return {
        limit: Math.min(options.limit ?? RAG_CONFIG.DEFAULT_LIMIT, RAG_CONFIG.MAX_LIMIT),
        threshold: Math.max(
            RAG_CONFIG.MIN_THRESHOLD,
            Math.min(options.threshold ?? RAG_CONFIG.DEFAULT_THRESHOLD, RAG_CONFIG.MAX_THRESHOLD)
        ),
        maxContextTokens: options.maxContextTokens ?? RAG_CONFIG.DEFAULT_MAX_CONTEXT_TOKENS,
    };
}