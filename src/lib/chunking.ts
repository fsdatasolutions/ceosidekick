// src/lib/chunking.ts
// Document chunking utilities for CEO Sidekick Knowledge Base

export interface Chunk {
  content: string;
  index: number;
  tokenCount: number;
  metadata: {
    startChar: number;
    endChar: number;
  };
}

export interface ChunkingOptions {
  chunkSize?: number; // Target tokens per chunk (default: 500)
  chunkOverlap?: number; // Overlap tokens between chunks (default: 50)
  minChunkSize?: number; // Minimum chunk size to keep (default: 100)
}

const DEFAULT_OPTIONS: Required<ChunkingOptions> = {
  chunkSize: 500,
  chunkOverlap: 50,
  minChunkSize: 100,
};

/**
 * Estimate token count (~4 characters per token for English)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Find natural break points in text
 * Priority: paragraph > sentence > word
 */
function findBreakPoint(
  text: string,
  targetCharPos: number,
  windowSize: number = 200
): number {
  const start = Math.max(0, targetCharPos - windowSize);
  const end = Math.min(text.length, targetCharPos + windowSize);
  const window = text.slice(start, end);
  const offset = start;

  // Try paragraph break (double newline)
  const paragraphBreaks = [...window.matchAll(/\n\n/g)];
  if (paragraphBreaks.length > 0) {
    let closest = paragraphBreaks[0];
    for (const match of paragraphBreaks) {
      if (
        Math.abs(offset + (match.index ?? 0) - targetCharPos) <
        Math.abs(offset + (closest.index ?? 0) - targetCharPos)
      ) {
        closest = match;
      }
    }
    return offset + (closest.index ?? 0) + 2;
  }

  // Try sentence break
  const sentenceBreaks = [...window.matchAll(/[.!?]\s+/g)];
  if (sentenceBreaks.length > 0) {
    let closest = sentenceBreaks[0];
    for (const match of sentenceBreaks) {
      if (
        Math.abs(offset + (match.index ?? 0) - targetCharPos) <
        Math.abs(offset + (closest.index ?? 0) - targetCharPos)
      ) {
        closest = match;
      }
    }
    return offset + (closest.index ?? 0) + (closest[0]?.length ?? 2);
  }

  // Try word break
  const wordBreaks = [...window.matchAll(/\s+/g)];
  if (wordBreaks.length > 0) {
    let closest = wordBreaks[0];
    for (const match of wordBreaks) {
      if (
        Math.abs(offset + (match.index ?? 0) - targetCharPos) <
        Math.abs(offset + (closest.index ?? 0) - targetCharPos)
      ) {
        closest = match;
      }
    }
    return offset + (closest.index ?? 0) + (closest[0]?.length ?? 1);
  }

  return targetCharPos;
}

/**
 * Clean and normalize text
 */
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Split text into overlapping chunks with semantic boundaries
 */
export function chunkText(
  text: string,
  options: ChunkingOptions = {}
): Chunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const cleanedText = cleanText(text);

  if (!cleanedText) {
    return [];
  }

  // Convert token targets to character estimates
  const targetChars = opts.chunkSize * 4;
  const overlapChars = opts.chunkOverlap * 4;
  const minChars = opts.minChunkSize * 4;

  const chunks: Chunk[] = [];
  let startPos = 0;
  let chunkIndex = 0;

  while (startPos < cleanedText.length) {
    const targetEndPos = startPos + targetChars;

    // If near the end, take the rest
    if (targetEndPos >= cleanedText.length - minChars) {
      const content = cleanedText.slice(startPos).trim();
      if (content.length >= minChars || chunks.length === 0) {
        chunks.push({
          content,
          index: chunkIndex,
          tokenCount: estimateTokens(content),
          metadata: {
            startChar: startPos,
            endChar: cleanedText.length,
          },
        });
      }
      break;
    }

    // Find natural break point
    const endPos = findBreakPoint(cleanedText, targetEndPos);
    const content = cleanedText.slice(startPos, endPos).trim();

    if (content.length >= minChars) {
      chunks.push({
        content,
        index: chunkIndex,
        tokenCount: estimateTokens(content),
        metadata: {
          startChar: startPos,
          endChar: endPos,
        },
      });
      chunkIndex++;
    }

    // Move start position (with overlap)
    startPos = Math.max(startPos + 1, endPos - overlapChars);
  }

  return chunks;
}

/**
 * Chunk markdown by headers
 */
export function chunkMarkdown(
  text: string,
  options: ChunkingOptions = {}
): Chunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const cleanedText = cleanText(text);

  if (!cleanedText) {
    return [];
  }

  // Split by ## or ### headers
  const sections = cleanedText.split(/(?=^#{2,3}\s)/m);
  const chunks: Chunk[] = [];
  let charOffset = 0;

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) {
      charOffset += section.length;
      continue;
    }

    const tokenCount = estimateTokens(trimmed);

    // If section is too large, chunk it further
    if (tokenCount > opts.chunkSize * 1.5) {
      const subChunks = chunkText(trimmed, opts);
      for (const subChunk of subChunks) {
        chunks.push({
          ...subChunk,
          index: chunks.length,
          metadata: {
            startChar: charOffset + subChunk.metadata.startChar,
            endChar: charOffset + subChunk.metadata.endChar,
          },
        });
      }
    } else if (tokenCount >= opts.minChunkSize) {
      chunks.push({
        content: trimmed,
        index: chunks.length,
        tokenCount,
        metadata: {
          startChar: charOffset,
          endChar: charOffset + section.length,
        },
      });
    }

    charOffset += section.length;
  }

  return chunks;
}

/**
 * Auto-detect best chunking strategy based on file type
 */
export function chunkDocument(
  text: string,
  mimeType: string,
  options: ChunkingOptions = {}
): Chunk[] {
  if (mimeType === "text/markdown" || mimeType === "text/x-markdown") {
    return chunkMarkdown(text, options);
  }
  return chunkText(text, options);
}

/**
 * Get chunking statistics
 */
export function getChunkStats(chunks: Chunk[]): {
  totalChunks: number;
  totalTokens: number;
  avgTokensPerChunk: number;
  minTokens: number;
  maxTokens: number;
} {
  if (chunks.length === 0) {
    return {
      totalChunks: 0,
      totalTokens: 0,
      avgTokensPerChunk: 0,
      minTokens: 0,
      maxTokens: 0,
    };
  }

  const tokenCounts = chunks.map((c) => c.tokenCount);
  const totalTokens = tokenCounts.reduce((a, b) => a + b, 0);

  return {
    totalChunks: chunks.length,
    totalTokens,
    avgTokensPerChunk: Math.round(totalTokens / chunks.length),
    minTokens: Math.min(...tokenCounts),
    maxTokens: Math.max(...tokenCounts),
  };
}
