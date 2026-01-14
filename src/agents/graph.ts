import { ChatAnthropic } from "@langchain/anthropic";
import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import {
  BaseMessage,
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { AgentConfig, AgentType } from "./types";
import { technologyPartnerConfig } from "./technology-partner";
import { executiveCoachConfig } from "./executive-coach";
import { legalAdvisorConfig } from "./legal-advisor";
import { hrPartnerConfig } from "./hr-partner";
import { marketingPartnerConfig } from "./marketing-partner";
import { salesPartnerConfig } from "./sales-partner";
import { knowledgeBaseConfig } from "./knowledge-base";
import { contentEngineConfig } from "./content-engine";

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

  // Company profile
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

  // Products/Services and Target Market
  if (settings.productsServices || settings.targetMarket) {
    const businessParts: string[] = [];
    if (settings.productsServices) businessParts.push(`Products/Services: ${settings.productsServices}`);
    if (settings.targetMarket) businessParts.push(`Target Market: ${settings.targetMarket}`);
    if (businessParts.length > 0) {
      sections.push(`**Business**\n${businessParts.join("\n")}`);
    }
  }

  // User role
  if (settings.userRole || settings.yearsExperience || settings.areasOfFocus) {
    const roleParts: string[] = [];
    if (settings.userRole) roleParts.push(`Role: ${settings.userRole}`);
    if (settings.yearsExperience) roleParts.push(`Experience: ${settings.yearsExperience}`);
    if (settings.areasOfFocus) roleParts.push(`Focus Areas: ${settings.areasOfFocus}`);
    if (roleParts.length > 0) {
      sections.push(`**User Profile**\n${roleParts.join("\n")}`);
    }
  }

  // Business context
  if (settings.currentChallenges || settings.shortTermGoals || settings.longTermGoals) {
    const contextParts: string[] = [];
    if (settings.currentChallenges) contextParts.push(`Current Challenges: ${settings.currentChallenges}`);
    if (settings.shortTermGoals) contextParts.push(`Short-term Goals: ${settings.shortTermGoals}`);
    if (settings.longTermGoals) contextParts.push(`Long-term Goals: ${settings.longTermGoals}`);
    if (contextParts.length > 0) {
      sections.push(`**Current Context**\n${contextParts.join("\n")}`);
    }
  }

  // Tech & Team
  if (settings.techStack || settings.teamStructure) {
    const techParts: string[] = [];
    if (settings.techStack) techParts.push(`Tech Stack: ${settings.techStack}`);
    if (settings.teamStructure) techParts.push(`Team Structure: ${settings.teamStructure}`);
    if (techParts.length > 0) {
      sections.push(`**Technical Environment**\n${techParts.join("\n")}`);
    }
  }

  if (sections.length === 0) {
    return "";
  }

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

  if (prefs.length === 0) {
    return "";
  }

  return `\n\n## Communication Preferences\n${prefs.join(" ")}`;
}

// Build personalized system prompt
export function buildSystemPrompt(
    basePrompt: string,
    settings?: UserSettings,
    ragContext?: string  // NEW: RAG context for Knowledge Base
): string {
  let prompt = basePrompt;

  // Add user context if available
  if (settings) {
    const userContext = buildUserContext(settings);
    const preferences = buildPreferences(settings);

    console.log("[Prompt] User context length:", userContext.length, "chars");
    console.log("[Prompt] Preferences:", preferences ? "applied" : "none");

    if (userContext) {
      console.log("[Prompt] Context preview:", userContext.slice(0, 200) + "...");
    }

    prompt = prompt + userContext + preferences;
  } else {
    console.log("[Prompt] No user settings provided");
  }

  // Add RAG context if available (for Knowledge Base agent)
  if (ragContext) {
    console.log("[Prompt] Adding RAG context, length:", ragContext.length, "chars");
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
};

// Normalize agent type for backwards compatibility
// Maps old agent names to new ones and provides fallback
function normalizeAgentType(agent: string): AgentType {
  console.log(`[normalizeAgentType] Input: "${agent}" (type: ${typeof agent})`);

  // Handle undefined/null/empty
  if (!agent) {
    console.warn(`[normalizeAgentType] Empty/undefined agent, defaulting to "technology"`);
    return "technology";
  }

  // Map old "strategy" to new "technology"
  if (agent === "strategy") {
    console.log(`[normalizeAgentType] Mapped "strategy" -> "technology"`);
    return "technology";
  }
  // Check if it's a valid agent type
  if (agent in agentConfigs) {
    return agent as AgentType;
  }
  // Fallback to technology
  console.warn(`[Agent] Unknown agent type "${agent}", falling back to "technology"`);
  return "technology";
}

// Get agent config with fallback
function getAgentConfig(agent: string): AgentConfig {
  console.log(`[getAgentConfig] Getting config for: "${agent}"`);
  const normalizedAgent = normalizeAgentType(agent);
  console.log(`[getAgentConfig] Normalized to: "${normalizedAgent}"`);
  const config = agentConfigs[normalizedAgent];
  console.log(`[getAgentConfig] Config found: ${config ? config.name : 'UNDEFINED!'}`);

  // Final safety check
  if (!config) {
    console.error(`[getAgentConfig] Config still undefined! Returning technologyPartnerConfig`);
    return technologyPartnerConfig;
  }
  return config;
}

// Create the language model
function createLLM(config: AgentConfig) {
  if (!config) {
    console.error("[LLM] No config provided, using technology partner as fallback");
    config = technologyPartnerConfig;
  }
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

  // Prepare messages with system prompt
  const messagesWithSystem = [
    new SystemMessage(config.systemPrompt),
    ...state.messages,
  ];

  // Generate response
  const response = await llm.invoke(messagesWithSystem);

  return {
    messages: [response],
  };
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
  agent: string; // Accept string to handle legacy agent names
  conversationId?: string;
  userId?: string;
}): Promise<{ content: string; messages: BaseMessage[] }> {
  const graph = getGraph();
  const normalizedAgent = normalizeAgentType(params.agent);

  // Convert messages to LangChain format
  const langchainMessages: BaseMessage[] = params.messages.map((msg) =>
      msg.role === "user"
          ? new HumanMessage(msg.content)
          : new AIMessage(msg.content)
  );

  // Run the graph
  const result = await graph.invoke({
    messages: langchainMessages,
    agent: normalizedAgent,
    conversationId: params.conversationId,
    userId: params.userId,
  });

  // Get the last AI message
  const lastMessage = result.messages[result.messages.length - 1];
  const content =
      typeof lastMessage.content === "string"
          ? lastMessage.content
          : JSON.stringify(lastMessage.content);

  return {
    content,
    messages: result.messages,
  };
}

// Streaming version for real-time responses
export async function* streamConversation(params: {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  agent: string; // Accept string to handle legacy agent names
  conversationId?: string;
  userId?: string;
  settings?: UserSettings;
  ragContext?: string;  // NEW: RAG context for Knowledge Base agent
}): AsyncGenerator<string> {
  const config = getAgentConfig(params.agent);
  const llm = createLLM(config);

  console.log("[Stream] Starting stream for agent:", params.agent);
  console.log("[Stream] Normalized to config:", config.id);
  console.log("[Stream] Message count:", params.messages.length);
  console.log("[Stream] Has settings:", !!params.settings);
  console.log("[Stream] Has RAG context:", !!params.ragContext);  // NEW

  if (params.settings) {
    console.log("[Stream] Settings company:", params.settings.companyName);
    console.log("[Stream] Settings techStack:", params.settings.techStack?.slice(0, 50));
  }

  if (params.ragContext) {
    console.log("[Stream] RAG context length:", params.ragContext.length, "chars");  // NEW
  }

  // Build personalized system prompt (now includes RAG context)
  const systemPrompt = buildSystemPrompt(
      config.systemPrompt,
      params.settings,
      params.ragContext  // NEW: Pass RAG context
  );

  console.log("[Stream] System prompt length:", systemPrompt.length, "chars");
  console.log("[Stream] Base prompt length:", config.systemPrompt.length, "chars");
  console.log("[Stream] Added context:", systemPrompt.length - config.systemPrompt.length, "chars");

  // Convert messages to LangChain format
  const langchainMessages: BaseMessage[] = [
    new SystemMessage(systemPrompt),
    ...params.messages.map((msg) =>
        msg.role === "user"
            ? new HumanMessage(msg.content)
            : new AIMessage(msg.content)
    ),
  ];

  // Stream the response
  const stream = await llm.stream(langchainMessages);

  let chunkCount = 0;
  for await (const chunk of stream) {
    chunkCount++;
    console.log("[Stream] Chunk", chunkCount, "type:", typeof chunk.content);

    // Handle different content types
    let content = "";
    if (typeof chunk.content === "string") {
      content = chunk.content;
    } else if (Array.isArray(chunk.content)) {
      // Content might be an array of content blocks
      content = chunk.content
          .map((c) => (typeof c === "string" ? c : c.text || ""))
          .join("");
    }

    if (content) {
      console.log("[Stream] Yielding:", content.slice(0, 50));
      yield content;
    }
  }

  console.log("[Stream] Complete. Total chunks:", chunkCount);
}

// Export agent configs for UI
export { agentConfigs, normalizeAgentType, getAgentConfig };