// src/lib/api-pricing.ts
// Anthropic API pricing for cost estimation
// Prices are per million tokens (USD)
// Last updated: 2025-02 — verify at https://www.anthropic.com/pricing

export const ANTHROPIC_PRICING: Record<string, { input: number; output: number }> = {
    "claude-opus-4-6":            { input: 15.00, output: 75.00 },
    "claude-sonnet-4-5-20250929": { input:  3.00, output: 15.00 },
};

const DEFAULT_PRICING = { input: 3.00, output: 15.00 };

/**
 * Calculate estimated API cost in USD for a given model and token counts.
 */
export function calculateApiCost(
    model: string | null,
    inputTokens: number,
    outputTokens: number
): number {
    const pricing = (model && ANTHROPIC_PRICING[model]) || DEFAULT_PRICING;
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    return inputCost + outputCost;
}

/**
 * Format a USD cost for display (e.g. "$12.34")
 */
export function formatCost(cost: number): string {
    if (cost < 0.01 && cost > 0) return "<$0.01";
    return `$${cost.toFixed(2)}`;
}
