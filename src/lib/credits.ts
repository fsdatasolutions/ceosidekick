// src/lib/credits.ts
// Token-to-credit conversion utility
// Single source of truth for credit cost calculations

/**
 * Number of tokens (input + output combined) per credit.
 * 1 credit = 3,000 tokens
 */
export const TOKENS_PER_CREDIT = 3000;

/**
 * Minimum credit cost for any AI event.
 * Even a short exchange costs at least 1 credit.
 */
export const MINIMUM_CREDIT_COST = 1;

/**
 * Convert a total token count to credits.
 * Always rounds up; minimum 1 credit.
 */
export function tokensToCredits(totalTokens: number): number {
    if (totalTokens <= 0) return MINIMUM_CREDIT_COST;
    return Math.max(Math.ceil(totalTokens / TOKENS_PER_CREDIT), MINIMUM_CREDIT_COST);
}

/**
 * Calculate the credit cost given input and output token counts.
 */
export function calculateCreditCost(inputTokens: number, outputTokens: number): number {
    return tokensToCredits(inputTokens + outputTokens);
}
