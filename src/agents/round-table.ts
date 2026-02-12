// src/agents/round-table.ts
// Round Table: Multi-advisor orchestration for CEO Sidekick
// Enables collaborative "boardroom" discussions across all advisors

import { AgentConfig, AgentType } from "./types";

// ============================================
// ROUND TABLE TYPES
// ============================================

export interface RoundTableAdvisorResponse {
    advisorId: AgentType;
    advisorName: string;
    response: string;
    tokensUsed: number;
    relevanceScore: number;
}

export interface RoundTableResponse {
    synthesis: string;
    advisorResponses: RoundTableAdvisorResponse[];
    selectedAdvisors: AgentType[];
    totalTokensUsed: number;
}

// Advisors available for Round Table discussions
// Excludes Knowledge Base (requires RAG) and Content Engine (generative, not advisory)
export const ROUND_TABLE_ELIGIBLE_ADVISORS: AgentType[] = [
    "technology",
    "coach",
    "legal",
    "hr",
    "marketing",
    "sales",
];

export const ADVISOR_DISPLAY_NAMES: Record<string, string> = {
    technology: "Technology Partner",
    coach: "Executive Coach",
    legal: "Legal Advisor",
    hr: "HR Partner",
    marketing: "Marketing Partner",
    sales: "Sales Partner",
};

// ============================================
// RELEVANCE CLASSIFIER PROMPT
// ============================================

export const RELEVANCE_CLASSIFIER_PROMPT = `You are a routing classifier for a virtual C-suite advisory platform. Given a user's question, determine which advisors are most relevant to provide valuable input.

## Available Advisors
- **technology**: Technology strategy, digital transformation, build vs. buy, architecture, IT decisions, vendor selection, security, automation
- **coach**: Leadership development, decision-making, difficult conversations, goal setting, team dynamics, work-life balance, personal effectiveness
- **legal**: Contracts, compliance, business structure, IP protection, terms of service, employment law basics, regulatory matters
- **hr**: Hiring, job descriptions, performance management, HR policies, compensation, employee relations, onboarding, culture
- **marketing**: Brand strategy, digital marketing, content strategy, customer acquisition, market research, campaign planning, analytics
- **sales**: Sales process, pipeline management, closing techniques, pricing strategy, proposals, objection handling, sales team development

## Instructions
Analyze the user's question and return a JSON array of objects, each with:
- "advisor": the advisor id (string)
- "relevance": a score from 0.0 to 1.0 indicating how relevant this advisor is
- "reason": a brief explanation of why this advisor should weigh in (1 sentence)

Rules:
- Always return between 2 and 5 advisors
- Only include advisors with relevance >= 0.3
- Sort by relevance descending
- If the question is very broad or strategic, include more advisors
- If the question is narrow/specific, include fewer advisors
- Consider cross-functional implications (e.g., hiring has HR + legal + coach angles)

Return ONLY valid JSON, no other text. Example:
[
  {"advisor": "marketing", "relevance": 0.95, "reason": "Directly about brand positioning strategy"},
  {"advisor": "sales", "relevance": 0.7, "reason": "Brand positioning affects sales messaging and pipeline"},
  {"advisor": "coach", "relevance": 0.4, "reason": "Strategic decision-making framework could help prioritize"}
]`;

// ============================================
// SYNTHESIS PROMPT
// ============================================

export const SYNTHESIS_PROMPT = `You are the Round Table Facilitator for CEO Sidekick, synthesizing input from multiple C-suite advisors into a unified, actionable response for a business leader.

## Your Role
You've just facilitated a virtual boardroom discussion. Multiple advisors have weighed in on the user's question. Your job is to:

1. **Synthesize** their perspectives into one cohesive, well-organized response
2. **Highlight consensus** where advisors agree
3. **Surface tensions** where advisors have different priorities or recommendations
4. **Prioritize actionability** — the user should walk away with clear next steps
5. **Attribute key insights** — reference which advisor perspective drives each point (e.g., "From a legal standpoint..." or "Your technology team would recommend...")

## Formatting Guidelines
- Start with a brief executive summary (2-3 sentences)
- Organize by theme or decision area, NOT by advisor
- Use natural attribution like "From a marketing perspective..." rather than "The Marketing Partner said..."
- End with prioritized action items that synthesize across all perspectives
- If advisors disagree, present both sides fairly and explain the tradeoff
- Keep the tone confident and decisive — you're presenting a unified board recommendation

## What NOT to Do
- Don't just list each advisor's response sequentially
- Don't ignore conflicts between advisor recommendations
- Don't be wishy-washy — take a stance where the evidence supports it
- Don't repeat the same point from multiple angles

## Advisor Responses
The individual advisor responses will be provided below. Synthesize them into a single, powerful response.`;

// ============================================
// ADVISOR BRIEFING PROMPT ADDITION
// ============================================

// This is prepended to each advisor's system prompt when called in Round Table mode
export const ROUND_TABLE_ADVISOR_BRIEFING = `
## Round Table Context
You are participating in a Round Table discussion with other C-suite advisors. Multiple advisors are being consulted simultaneously on this question. Focus on YOUR area of expertise and provide your unique perspective. Be concise but thorough — your response will be synthesized with others into a unified recommendation.

Keep your response focused and avoid giving advice outside your core expertise (other advisors will cover their areas). Aim for 150-300 words unless the topic requires more depth in your area.
`;

// ============================================
// ROUND TABLE AGENT CONFIG
// ============================================

export const roundTableConfig: AgentConfig = {
    id: "roundtable" as AgentType,
    name: "Round Table",
    subtitle: "C-Suite Boardroom",
    description:
        "Get multi-perspective guidance from your entire virtual C-suite in one conversation",
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: SYNTHESIS_PROMPT,
};