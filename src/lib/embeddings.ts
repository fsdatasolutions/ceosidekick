// src/lib/embeddings.ts
// OpenAI embedding utilities for CEO Sidekick Knowledge Base

import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Using text-embedding-3-small for cost efficiency
// 1536 dimensions, ~$0.02 per 1M tokens
const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;

/**
 * Generate embedding for a single text
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts (batch)
 * More efficient than calling one at a time
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  if (texts.length === 0) return [];

  // OpenAI allows up to 2048 inputs per request, but we'll batch by 100
  const batchSize = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    // Sort by index to maintain order (OpenAI may return out of order)
    const sorted = response.data.sort((a, b) => a.index - b.index);
    allEmbeddings.push(...sorted.map((d) => d.embedding));
  }

  return allEmbeddings;
}

/**
 * Estimate token count (rough approximation)
 * OpenAI's tokenizer averages ~4 chars per token for English
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

export { EMBEDDING_MODEL, EMBEDDING_DIMENSIONS };