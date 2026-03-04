// Centralized AI model configuration
// Change models per domain here — all code references this single file.

export type AIDomain =
  | "chat"            // Advisory chat (agents/graph.ts)
  | "contentPost"     // LinkedIn post generation
  | "contentArticle"  // LinkedIn article generation
  | "contentBlog"     // Web blog generation
  | "contentCampaign" // Campaign text generation
  | "imagePrompt"     // DALL-E prompt generation (text model, not DALL-E itself)
  | "roundTable"      // Round Table classifier + advisor calls + synthesis
  | "onboarding"      // Onboarding AI suggestions (free, no credits)
  | "goals"           // Goal step generation (uses credits)

const AI_MODELS: Record<AIDomain, string> = {
  chat:            "claude-opus-4-6",
  contentPost:     "claude-sonnet-4-5-20250929",
  contentArticle:  "claude-sonnet-4-5-20250929",
  contentBlog:     "claude-sonnet-4-5-20250929",
  contentCampaign: "claude-sonnet-4-5-20250929",
  imagePrompt:     "claude-sonnet-4-5-20250929",
  roundTable:      "claude-opus-4-6",
  onboarding:      "claude-sonnet-4-5-20250929",
  goals:           "claude-sonnet-4-5-20250929",
};

/** Get the model ID for a given domain. */
export function getModel(domain: AIDomain): string {
  return AI_MODELS[domain];
}
