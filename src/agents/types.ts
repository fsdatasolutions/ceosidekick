// src/agents/types.ts
// Agent type definitions for CEO Sidekick
// Updated with RAG support for Knowledge Base and Round Table support

import { BaseMessage } from "@langchain/core/messages";
import { LucideIcon } from "lucide-react";

// ============================================
// AGENT TYPES
// ============================================

export type AgentType =
    | "technology"
    | "coach"
    | "legal"
    | "hr"
    | "marketing"
    | "sales"
    | "knowledge"
    | "content"
    | "roundtable";

// ============================================
// RAG CONFIGURATION
// ============================================

export interface RAGOptions {
  limit: number;              // Number of chunks to retrieve (default: 5)
  threshold: number;          // Minimum similarity score 0-1 (default: 0.7)
  maxContextTokens: number;   // Max tokens for context window (default: 3000)
}

// ============================================
// AGENT CONFIGURATION
// ============================================

export interface AgentConfig {
  id: AgentType;
  name: string;
  subtitle: string;
  description: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;

  // RAG Configuration (optional - used by Knowledge Base agent)
  useRAG?: boolean;
  ragOptions?: RAGOptions;
}

// ============================================
// UI CONFIGURATION
// ============================================

export interface AgentUIConfig {
  id: AgentType;
  name: string;
  subtitle: string;
  description: string;
  color: string;
  lightColor: string;
  textColor: string;
  capabilities: string[];
  example: string;
  disclaimer?: string;
  href: string;
  external?: boolean;
  paidOnly?: boolean; // NEW: Indicates feature is for paid tiers only
}

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
  messagesCharged: number; // How many messages this counted as
}

export interface RoundTableStreamEvent {
  type: "advisor_start" | "advisor_chunk" | "advisor_complete" | "synthesis_start" | "synthesis_chunk" | "synthesis_complete" | "error";
  advisorId?: AgentType;
  advisorName?: string;
  content?: string;
  tokensUsed?: number;
  relevanceScore?: number;
  error?: string;
}

// ============================================
// CONVERSATION STATE (LangGraph)
// ============================================

export interface ConversationState {
  messages: BaseMessage[];
  conversationId?: string;
  userId?: string;
  agent: AgentType;
  metadata?: Record<string, unknown>;
}

// ============================================
// API TYPES
// ============================================

export interface ChatRequest {
  message: string;
  conversationId?: string;
  agent: AgentType;
  // Round Table specific
  selectedAdvisors?: AgentType[]; // User can force-select advisors
}

export interface ChatResponse {
  content: string;
  conversationId: string;
  messageId: string;
}

// ============================================
// DOCUMENT TYPES (for Knowledge Base)
// ============================================

export interface DocumentMetadata {
  totalTokens?: number;
  avgChunkSize?: number;
  textLength?: number;
  pageCount?: number;
  wordCount?: number;
}

export interface SearchResult {
  chunkId: string;
  documentId: string;
  documentName: string;
  content: string;
  similarity: number;
  chunkIndex: number;
  metadata: Record<string, unknown> | null;
}

export interface DocumentUploadResponse {
  document: {
    id: string;
    name: string;
    status: string;
    size: number;
  };
  message: string;
}

export interface DocumentSearchRequest {
  query: string;
  limit?: number;
  threshold?: number;
}

export interface DocumentSearchResponse {
  results: SearchResult[];
  context: string;
  count: number;
}