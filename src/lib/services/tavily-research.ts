// src/lib/services/tavily-research.ts
// Web research service using Tavily API for grounding content in real data

export interface ResearchResult {
    title: string;
    url: string;
    snippet: string;
}

/**
 * Search for current research, data, and trends on a given topic.
 * Uses the Tavily REST API directly for simplicity.
 */
export async function researchTopic(
    topic: string,
    maxResults: number = 5
): Promise<ResearchResult[]> {
    if (!process.env.TAVILY_API_KEY) {
        console.warn("[tavily-research] TAVILY_API_KEY not set, skipping research");
        return [];
    }

    try {
        const response = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: process.env.TAVILY_API_KEY,
                query: topic,
                max_results: maxResults,
                search_depth: "basic",
                include_answer: false,
            }),
        });

        if (!response.ok) {
            console.error("[tavily-research] API error:", response.status);
            return [];
        }

        const data = await response.json();
        const results: Array<{ title?: string; url?: string; content?: string }> =
            data.results || [];

        return results.map((r) => ({
            title: r.title || "",
            url: r.url || "",
            snippet: r.content || "",
        }));
    } catch (error) {
        console.error("[tavily-research] Search failed:", error);
        return [];
    }
}

/**
 * Format research results into a context block for prompt injection.
 */
export function formatResearchContext(results: ResearchResult[]): string {
    if (results.length === 0) return "";

    const lines = results.map(
        (r, i) =>
            `[${i + 1}] ${r.title}\n    ${r.snippet}\n    Source: ${r.url}`
    );

    return `--- Research Context (Real Data & Trends) ---\n${lines.join("\n\n")}`;
}
