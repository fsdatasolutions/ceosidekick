import { ChatAnthropic } from "@langchain/anthropic";
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { AgentConfig, AgentType, RoundTableAdvisorResponse, RoundTableStreamEvent } from "./types";
import { technologyPartnerConfig } from "./technology-partner";
import { executiveCoachConfig } from "./executive-coach";
import { legalAdvisorConfig } from "./legal-advisor";
import { hrPartnerConfig } from "./hr-partner";
import { marketingPartnerConfig } from "./marketing-partner";
import { salesPartnerConfig } from "./sales-partner";
import { knowledgeBaseConfig } from "./knowledge-base";
import { contentEngineConfig } from "./content-engine";
import {
  roundTableConfig,
  RELEVANCE_CLASSIFIER_PROMPT,
  SYNTHESIS_PROMPT,
  ROUND_TABLE_ADVISOR_BRIEFING,
  ROUND_TABLE_ELIGIBLE_ADVISORS,
  ADVISOR_DISPLAY_NAMES,
} from "./round-table";

// User settings type
export interface UserSettings {
  companyName?: string;
  industry?: string;
  companySize?: string;
  annualRevenue?: string;
  productsServices?: string;
  targetMarket?: string;
  userRole?: string;
  yearsExperience?: string;
  areasOfFocus?: string;
  currentChallenges?: string;
  shortTermGoals?: string;
  longTermGoals?: string;
  techStack?: string;
  teamStructure?: string;
  communicationStyle?: string;
  responseLength?: string;
}

// Build user context section for system prompt
function buildUserContext(settings: UserSettings): string {
  const sections: string[] = [];

  if (settings.companyName || settings.industry || settings.companySize) {
    const companyParts: string[] = [];
    if (settings.companyName) companyParts.push(`Company: ${settings.companyName}`);
    if (settings.industry) companyParts.push(`Industry: ${settings.industry}`);
    if (settings.companySize) companyParts.push(`Size: ${settings.companySize}`);
    if (settings.annualRevenue) companyParts.push(`Revenue: ${settings.annualRevenue}`);
    if (companyParts.length > 0) {
      sections.push(`**Company Profile**\n${companyParts.join("\n")}`);
    }
  }

  if (settings.productsServices || settings.targetMarket) {
    const businessParts: string[] = [];
    if (settings.productsServices) businessParts.push(`Products/Services: ${settings.productsServices}`);
    if (settings.targetMarket) businessParts.push(`Target Market: ${settings.targetMarket}`);
    if (businessParts.length > 0) {
      sections.push(`**Business**\n${businessParts.join("\n")}`);
    }
  }

  if (settings.userRole || settings.yearsExperience || settings.areasOfFocus) {
    const roleParts: string[] = [];
    if (settings.userRole) roleParts.push(`Role: ${settings.userRole}`);
    if (settings.yearsExperience) roleParts.push(`Experience: ${settings.yearsExperience}`);
    if (settings.areasOfFocus) roleParts.push(`Focus Areas: ${settings.areasOfFocus}`);
    if (roleParts.length > 0) {
      sections.push(`**User Profile**\n${roleParts.join("\n")}`);
    }
  }

  if (settings.currentChallenges || settings.shortTermGoals || settings.longTermGoals) {
    const contextParts: string[] = [];
    if (settings.currentChallenges) contextParts.push(`Current Challenges: ${settings.currentChallenges}`);
    if (settings.shortTermGoals) contextParts.push(`Short-term Goals: ${settings.shortTermGoals}`);
    if (settings.longTermGoals) contextParts.push(`Long-term Goals: ${settings.longTermGoals}`);
    if (contextParts.length > 0) {
      sections.push(`**Current Context**\n${contextParts.join("\n")}`);
    }
  }

  if (settings.techStack || settings.teamStructure) {
    const techParts: string[] = [];
    if (settings.techStack) techParts.push(`Tech Stack: ${settings.techStack}`);
    if (settings.teamStructure) techParts.push(`Team Structure: ${settings.teamStructure}`);
    if (techParts.length > 0) {
      sections.push(`**Technical Environment**\n${techParts.join("\n")}`);
    }
  }

  if (sections.length === 0) return "";

  return `\n\n## User Context\nThe following information has been provided about the user and their business. Use this to personalize your advice:\n\n${sections.join("\n\n")}`;
}

// Build communication preferences for system prompt
function buildPreferences(settings: UserSettings): string {
  const prefs: string[] = [];

  if (settings.communicationStyle) {
    const styleMap: Record<string, string> = {
      formal: "Use a formal, professional tone.",
      casual: "Use a casual, conversational tone.",
      technical: "Use a technical, detailed approach with precise terminology.",
    };
    if (styleMap[settings.communicationStyle]) {
      prefs.push(styleMap[settings.communicationStyle]);
    }
  }

  if (settings.responseLength) {
    const lengthMap: Record<string, string> = {
      concise: "Keep responses brief and to the point.",
      detailed: "Provide detailed explanations with reasoning.",
      comprehensive: "Give thorough, comprehensive analysis.",
    };
    if (lengthMap[settings.responseLength]) {
      prefs.push(lengthMap[settings.responseLength]);
    }
  }

  if (prefs.length === 0) return "";

  return `\n\n## Communication Preferences\n${prefs.join(" ")}`;
}

// Build personalized system prompt
export function buildSystemPrompt(
    basePrompt: string,
    settings?: UserSettings,
    ragContext?: string
): string {
  let prompt = basePrompt;

  if (settings) {
    const userContext = buildUserContext(settings);
    const preferences = buildPreferences(settings);
    prompt = prompt + userContext + preferences;
  }

  if (ragContext) {
    prompt = prompt + "\n\n" + ragContext;
  }

  return prompt;
}

// Define the state schema using Annotation
const ConversationStateAnnotation = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
  agent: Annotation<AgentType>({
    reducer: (_, update) => update,
    default: () => "technology" as AgentType,
  }),
  conversationId: Annotation<string | undefined>({
    reducer: (_, update) => update,
    default: () => undefined,
  }),
  userId: Annotation<string | undefined>({
    reducer: (_, update) => update,
    default: () => undefined,
  }),
});

type ConversationState = typeof ConversationStateAnnotation.State;

// Agent configurations map
const agentConfigs: Record<AgentType, AgentConfig> = {
  technology: technologyPartnerConfig,
  coach: executiveCoachConfig,
  legal: legalAdvisorConfig,
  hr: hrPartnerConfig,
  marketing: marketingPartnerConfig,
  sales: salesPartnerConfig,
  knowledge: knowledgeBaseConfig,
  content: contentEngineConfig,
  roundtable: roundTableConfig,
};

// Normalize agent type for backwards compatibility
function normalizeAgentType(agent: string): AgentType {
  if (!agent) return "technology";
  if (agent === "strategy") return "technology";
  if (agent in agentConfigs) return agent as AgentType;
  console.warn(`[Agent] Unknown agent type "${agent}", falling back to "technology"`);
  return "technology";
}

// Get agent config with fallback
function getAgentConfig(agent: string): AgentConfig {
  const normalizedAgent = normalizeAgentType(agent);
  const config = agentConfigs[normalizedAgent];
  if (!config) {
    console.error(`[getAgentConfig] Config undefined for "${normalizedAgent}", returning technology`);
    return technologyPartnerConfig;
  }
  return config;
}

// Create the language model
function createLLM(config: AgentConfig) {
  if (!config) config = technologyPartnerConfig;
  return new ChatAnthropic({
    model: "claude-sonnet-4-20250514",
    temperature: config.temperature ?? 0.7,
    maxTokens: config.maxTokens ?? 4096,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  });
}

// Node: Generate response from the agent
async function generateResponse(
    state: ConversationState
): Promise<Partial<ConversationState>> {
  const config = getAgentConfig(state.agent);
  const llm = createLLM(config);

  const messagesWithSystem = [
    new SystemMessage(config.systemPrompt),
    ...state.messages,
  ];

  const response = await llm.invoke(messagesWithSystem);

  return { messages: [response] };
}

// Create the conversation graph
function createConversationGraph() {
  const workflow = new StateGraph(ConversationStateAnnotation)
      .addNode("generate", generateResponse)
      .addEdge(START, "generate")
      .addEdge("generate", END);

  return workflow.compile();
}

// Singleton graph instance
let graphInstance: ReturnType<typeof createConversationGraph> | null = null;

function getGraph() {
  if (!graphInstance) {
    graphInstance = createConversationGraph();
  }
  return graphInstance;
}

// Main function to run a conversation turn
export async function runConversation(params: {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  agent: string;
  conversationId?: string;
  userId?: string;
}): Promise<{ content: string; messages: BaseMessage[] }> {
  const graph = getGraph();
  const normalizedAgent = normalizeAgentType(params.agent);

  const langchainMessages: BaseMessage[] = params.messages.map((msg) =>
      msg.role === "user"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
  );

  const result = await graph.invoke({
    messages: langchainMessages,
    agent: normalizedAgent,
    conversationId: params.conversationId,
    userId: params.userId,
  });

  const lastMessage = result.messages[result.messages.length - 1];
  const content =
      typeof lastMessage.content === "string"
          ? lastMessage.content
          : JSON.stringify(lastMessage.content);

  return { content, messages: result.messages };
}

// Streaming version for real-time responses (individual advisors)
export async function* streamConversation(params: {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  agent: string;
  conversationId?: string;
  userId?: string;
  settings?: UserSettings;
  ragContext?: string;
}): AsyncGenerator<string> {
  const config = getAgentConfig(params.agent);
  const llm = createLLM(config);

  const systemPrompt = buildSystemPrompt(
      config.systemPrompt,
      params.settings,
      params.ragContext
  );

  const langchainMessages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...params.messages.map((msg) =>
        msg.role === "user"
            ? new HumanMessage(msg.content)
            : new AIMessage(msg.content)
    ),
  ];

  const stream = await llm.stream(langchainMessages);

  for await (const chunk of stream) {
    let content = "";
    if (typeof chunk.content === "string") {
      content = chunk.content;
    } else if (Array.isArray(chunk.content)) {
      content = chunk.content
          .map((c) => (typeof c === "string" ? c : c.text || ""))
          .join("");
    }
    if (content) yield content;
  }
}

// ============================================
// ROUND TABLE ORCHESTRATION
// ============================================

/**
 * Classify which advisors are relevant for the given question.
 * Returns sorted array of { advisor, relevance, reason }.
 */
async function classifyRelevantAdvisors(
    userMessage: string,
    settings?: UserSettings
): Promise<Array<{ advisor: AgentType; relevance: number; reason: string }>> {
  const llm = new ChatAnthropic({
    model: "claude-sonnet-4-20250514",
    temperature: 0.2,
    maxTokens: 1024,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  });

  let classifierPrompt = RELEVANCE_CLASSIFIER_PROMPT;

  // Add business context to help with classification
  if (settings) {
    const userContext = buildUserContext(settings);
    if (userContext) {
      classifierPrompt += `\n\n${userContext}`;
    }
  }

  const messages = [
    new SystemMessage(classifierPrompt),
    new HumanMessage(userMessage),
  ];

  try {
    const response = await llm.invoke(messages);
    const content = typeof response.content === "string"
        ? response.content
        : JSON.stringify(response.content);

    // Parse JSON response — handle potential markdown code fences
    const cleaned = content.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(cleaned) as Array<{
      advisor: string;
      relevance: number;
      reason: string;
    }>;

    // Validate and filter to eligible advisors
    return parsed
        .filter(
            (item) =>
                ROUND_TABLE_ELIGIBLE_ADVISORS.includes(item.advisor as AgentType) &&
                item.relevance >= 0.3
        )
        .map((item) => ({
          advisor: item.advisor as AgentType,
          relevance: item.relevance,
          reason: item.reason,
        }))
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 5); // Max 5 advisors
  } catch (error) {
    console.error("[RoundTable] Classification failed, using defaults:", error);
    // Fallback: use top 3 most common advisors
    return [
      { advisor: "technology", relevance: 0.7, reason: "Default advisor" },
      { advisor: "coach", relevance: 0.6, reason: "Default advisor" },
      { advisor: "marketing", relevance: 0.5, reason: "Default advisor" },
    ];
  }
}

/**
 * Call a single advisor and collect the full response.
 * Returns the advisor's response with token count.
 */
async function callAdvisor(
    advisorId: AgentType,
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    settings?: UserSettings,
    conversationHistory?: string
): Promise<{ response: string; tokensUsed: number }> {
  const config = getAgentConfig(advisorId);
  const llm = new ChatAnthropic({
    model: "claude-sonnet-4-20250514",
    temperature: config.temperature ?? 0.7,
    maxTokens: 2048, // Shorter for individual advisor responses in Round Table
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Build advisor system prompt with Round Table briefing + user context
  let systemPrompt = config.systemPrompt + ROUND_TABLE_ADVISOR_BRIEFING;
  if (settings) {
    systemPrompt = buildSystemPrompt(systemPrompt, settings);
  }

  // Include conversation history context if available
  if (conversationHistory) {
    systemPrompt += `\n\n## Prior Round Table Discussion\nHere is the context from the ongoing Round Table conversation. Use this to provide continuity:\n\n${conversationHistory}`;
  }

  const langchainMessages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...messages.map((msg) =>
        msg.role === "user"
            ? new HumanMessage(msg.content)
            : new AIMessage(msg.content)
    ),
  ];

  try {
    const response = await llm.invoke(langchainMessages);
    const content =
        typeof response.content === "string"
            ? response.content
            : JSON.stringify(response.content);

    // Estimate token usage (rough: 1 token ≈ 4 chars)
    const inputTokens = Math.ceil(
        langchainMessages.reduce((sum, m) => {
          const c = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
          return sum + c.length;
        }, 0) / 4
    );
    const outputTokens = Math.ceil(content.length / 4);

    return {
      response: content,
      tokensUsed: inputTokens + outputTokens,
    };
  } catch (error) {
    console.error(`[RoundTable] Advisor ${advisorId} failed:`, error);
    return {
      response: `[${ADVISOR_DISPLAY_NAMES[advisorId] || advisorId} was unable to respond at this time.]`,
      tokensUsed: 0,
    };
  }
}

/**
 * Build conversation history string from prior Round Table messages.
 * Includes both syntheses and individual advisor responses for full context.
 */
function buildRoundTableHistory(
    messages: Array<{ role: "user" | "assistant"; content: string; metadata?: Record<string, unknown> }>
): string {
  if (messages.length <= 1) return ""; // Only current message, no history

  const historyParts: string[] = [];
  // Include all prior messages except the last one (current question)
  const priorMessages = messages.slice(0, -1);

  for (const msg of priorMessages) {
    if (msg.role === "user") {
      historyParts.push(`**User:** ${msg.content}`);
    } else {
      historyParts.push(`**Round Table Response:** ${msg.content}`);
    }
  }

  return historyParts.join("\n\n");
}

/**
 * Stream a Round Table conversation.
 * Orchestrates: classify → parallel advisor calls → synthesis stream.
 *
 * Yields RoundTableStreamEvent objects as JSON strings for the frontend to parse.
 */
export async function* streamRoundTableConversation(params: {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  conversationId?: string;
  userId?: string;
  settings?: UserSettings;
  selectedAdvisors?: AgentType[]; // User override for advisor selection
}): AsyncGenerator<string> {
  const currentMessage = params.messages[params.messages.length - 1]?.content || "";

  console.log("[RoundTable] Starting orchestration for:", currentMessage.slice(0, 100));

  // Step 1: Determine which advisors to consult
  let advisorsToConsult: Array<{ advisor: AgentType; relevance: number; reason: string }>;

  if (params.selectedAdvisors && params.selectedAdvisors.length > 0) {
    // User explicitly selected advisors
    console.log("[RoundTable] Using user-selected advisors:", params.selectedAdvisors);
    advisorsToConsult = params.selectedAdvisors
        .filter((a) => ROUND_TABLE_ELIGIBLE_ADVISORS.includes(a))
        .map((a) => ({ advisor: a, relevance: 1.0, reason: "User selected" }));
  } else {
    // Auto-classify relevance
    console.log("[RoundTable] Auto-classifying relevant advisors...");
    advisorsToConsult = await classifyRelevantAdvisors(currentMessage, params.settings);
  }

  // Ensure at least 2 advisors
  if (advisorsToConsult.length < 2) {
    advisorsToConsult = [
      { advisor: "technology", relevance: 0.7, reason: "Default" },
      { advisor: "coach", relevance: 0.6, reason: "Default" },
    ];
  }

  console.log("[RoundTable] Consulting advisors:", advisorsToConsult.map((a) => a.advisor));

  // Emit advisor selection event
  const selectionEvent: RoundTableStreamEvent = {
    type: "advisor_start",
    content: JSON.stringify(
        advisorsToConsult.map((a) => ({
          id: a.advisor,
          name: ADVISOR_DISPLAY_NAMES[a.advisor] || a.advisor,
          relevance: a.relevance,
          reason: a.reason,
        }))
    ),
  };
  yield `__RT_EVENT__${JSON.stringify(selectionEvent)}__RT_END__`;

  // Step 2: Build conversation history for context
  const conversationHistory = buildRoundTableHistory(params.messages);

  // Step 3: Call all advisors in parallel
  const advisorPromises = advisorsToConsult.map(async (item) => {
    const startEvent: RoundTableStreamEvent = {
      type: "advisor_start",
      advisorId: item.advisor,
      advisorName: ADVISOR_DISPLAY_NAMES[item.advisor],
    };
    // Note: Can't yield from inside Promise, events will be batched

    const result = await callAdvisor(
        item.advisor,
        // Send only the current user message for advisor calls
        // but include conversation history in the system prompt
        [{ role: "user" as const, content: currentMessage }],
        params.settings,
        conversationHistory
    );

    return {
      advisorId: item.advisor,
      advisorName: ADVISOR_DISPLAY_NAMES[item.advisor] || item.advisor,
      response: result.response,
      tokensUsed: result.tokensUsed,
      relevanceScore: item.relevance,
    } as RoundTableAdvisorResponse;
  });

  const advisorResponses = await Promise.all(advisorPromises);

  console.log("[RoundTable] All advisor responses collected");

  // Emit individual advisor responses for the drill-down UI
  for (const resp of advisorResponses) {
    const completeEvent: RoundTableStreamEvent = {
      type: "advisor_complete",
      advisorId: resp.advisorId,
      advisorName: resp.advisorName,
      content: resp.response,
      tokensUsed: resp.tokensUsed,
      relevanceScore: resp.relevanceScore,
    };
    yield `__RT_EVENT__${JSON.stringify(completeEvent)}__RT_END__`;
  }

  // Step 4: Synthesize responses
  console.log("[RoundTable] Starting synthesis...");

  const synthesisEvent: RoundTableStreamEvent = { type: "synthesis_start" };
  yield `__RT_EVENT__${JSON.stringify(synthesisEvent)}__RT_END__`;

  // Build synthesis prompt with all advisor responses
  const advisorInputs = advisorResponses
      .map(
          (r) =>
              `### ${r.advisorName} (Relevance: ${(r.relevanceScore * 100).toFixed(0)}%)\n${r.response}`
      )
      .join("\n\n---\n\n");

  let synthesisSystemPrompt = SYNTHESIS_PROMPT;
  if (params.settings) {
    synthesisSystemPrompt = buildSystemPrompt(synthesisSystemPrompt, params.settings);
  }

  const synthesisLLM = new ChatAnthropic({
    model: "claude-sonnet-4-20250514",
    temperature: 0.7,
    maxTokens: 4096,
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  });

  const synthesisMessages: BaseMessage[] = [
    new SystemMessage(synthesisSystemPrompt),
    new HumanMessage(
        `## User's Question\n${currentMessage}\n\n## Advisor Responses\n\n${advisorInputs}`
    ),
  ];

  // Stream the synthesis
  const synthesisStream = await synthesisLLM.stream(synthesisMessages);

  let totalSynthesisContent = "";
  for await (const chunk of synthesisStream) {
    let content = "";
    if (typeof chunk.content === "string") {
      content = chunk.content;
    } else if (Array.isArray(chunk.content)) {
      content = chunk.content
          .map((c) => (typeof c === "string" ? c : c.text || ""))
          .join("");
    }
    if (content) {
      totalSynthesisContent += content;
      const chunkEvent: RoundTableStreamEvent = {
        type: "synthesis_chunk",
        content,
      };
      yield `__RT_EVENT__${JSON.stringify(chunkEvent)}__RT_END__`;
    }
  }

  // Calculate total tokens
  const totalTokensUsed =
      advisorResponses.reduce((sum, r) => sum + r.tokensUsed, 0) +
      Math.ceil(totalSynthesisContent.length / 4) +
      Math.ceil(synthesisSystemPrompt.length / 4);

  // Number of messages to charge: 1 per advisor + 1 for synthesis + 1 for classification
  const messagesCharged = advisorResponses.length + 2;

  const completeEvent: RoundTableStreamEvent = {
    type: "synthesis_complete",
    content: JSON.stringify({
      totalTokensUsed,
      messagesCharged,
      advisorCount: advisorResponses.length,
    }),
  };
  yield `__RT_EVENT__${JSON.stringify(completeEvent)}__RT_END__`;

  console.log(
      `[RoundTable] Complete. Advisors: ${advisorResponses.length}, Tokens: ~${totalTokensUsed}, Messages charged: ${messagesCharged}`
  );
}

// Export agent configs for UI
export { agentConfigs, normalizeAgentType, getAgentConfig };