// src/app/api/documents/search/route.ts
// Vector search API for Knowledge Base

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * POST /api/documents/search
 * Search across user's documents using semantic similarity
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const orgId = (session.user as { organizationId?: string }).organizationId;

    const body = await req.json();
    const { query, limit = 5, threshold = 0.4 } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
          { error: "Query string required" },
          { status: 400 }
      );
    }

    if (query.length > 1000) {
      return NextResponse.json(
          { error: "Query too long (max 1000 characters)" },
          { status: 400 }
      );
    }

    // Check if OpenAI is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        results: [],
        context: "Search is not available. OPENAI_API_KEY is not configured.",
        count: 0,
      });
    }

    // Dynamic import of search utilities
    const { searchDocuments, formatResultsForContext } = await import("@/lib/vector-search");

    // Search documents
    const results = await searchDocuments(query, userId, orgId, {
      limit: Math.min(limit, 20),
      threshold: Math.max(0.3, Math.min(threshold, 0.95)), // Min 0.3, max 0.95
    });

    // Format for LLM context
    const formattedContext = formatResultsForContext(results);

    return NextResponse.json({
      results,
      context: formattedContext,
      count: results.length,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
        { error: "Search failed" },
        { status: 500 }
    );
  }
}