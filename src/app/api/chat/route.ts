// src/app/api/chat/route.ts
// Updated with RAG support and paywall enforcement

import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { streamConversation, UserSettings } from "@/agents/graph";
import { AgentType } from "@/agents/types";
import { eq, desc } from "drizzle-orm";
import { RAG_CONFIG } from "@/lib/rag-config";
import { checkMessageAllowance, incrementMessageUsage } from "@/lib/usage";

// Lazy database imports
async function getDb() {
  if (!process.env.DATABASE_URL) return null;
  const { db } = await import("@/db");
  return db;
}

async function getSchema() {
  const { conversations, messages, userSettings } = await import("@/db/schema");
  return { conversations, messages, userSettings };
}

// Fetch user settings from database
async function getUserSettings(userId: string): Promise<UserSettings | undefined> {
  console.log("[getUserSettings] Called with userId:", userId);

  const db = await getDb();
  if (!db) {
    console.log("[getUserSettings] No database - DATABASE_URL:", process.env.DATABASE_URL ? "set" : "not set");
    return undefined;
  }

  try {
    const { userSettings } = await getSchema();

    // Debug: Check all settings in database
    const allSettings = await db.select({ userId: userSettings.userId, company: userSettings.companyName }).from(userSettings).limit(5);
    console.log("[getUserSettings] All settings in DB:", JSON.stringify(allSettings));
    console.log("[getUserSettings] Looking for userId:", userId);

    const settings = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);

    console.log("[getUserSettings] Query returned:", settings.length, "rows");

    if (settings.length === 0) {
      console.log("[getUserSettings] No settings found for this user ID");
      return undefined;
    }

    const s = settings[0];
    console.log("[getUserSettings] Found! Company:", s.companyName, "TechStack:", s.techStack?.slice(0, 30));

    return {
      companyName: s.companyName || undefined,
      industry: s.industry || undefined,
      companySize: s.companySize || undefined,
      annualRevenue: s.annualRevenue || undefined,
      productsServices: s.productsServices || undefined,
      targetMarket: s.targetMarket || undefined,
      userRole: s.userRole || undefined,
      yearsExperience: s.yearsExperience || undefined,
      areasOfFocus: s.areasOfFocus || undefined,
      currentChallenges: s.currentChallenges || undefined,
      shortTermGoals: s.shortTermGoals || undefined,
      longTermGoals: s.longTermGoals || undefined,
      techStack: s.techStack || undefined,
      teamStructure: s.teamStructure || undefined,
      communicationStyle: s.communicationStyle || undefined,
      responseLength: s.responseLength || undefined,
    };
  } catch (error) {
    console.error("[getUserSettings] Error:", error);
    return undefined;
  }
}

// ============================================
// RAG: Fetch relevant document context
// ============================================
async function getRAGContext(
    query: string,
    userId: string,
    organizationId?: string
): Promise<string | undefined> {
  const db = await getDb();
  if (!db) {
    console.log("[getRAGContext] No database available");
    return undefined;
  }

  // Check if OpenAI is configured for embeddings
  if (!process.env.OPENAI_API_KEY) {
    console.log("[getRAGContext] OPENAI_API_KEY not configured, skipping RAG");
    return undefined;
  }

  try {
    // Dynamically import RAG utilities (they require OpenAI)
    const { searchDocuments, formatResultsForContext } = await import("@/lib/vector-search");

    console.log("[getRAGContext] Searching documents for:", query.slice(0, 50));

    // Use centralized config - no hardcoded values!
    const results = await searchDocuments(query, userId, organizationId, {
      limit: RAG_CONFIG.DEFAULT_LIMIT,
      threshold: RAG_CONFIG.DEFAULT_THRESHOLD,
    });

    console.log("[getRAGContext] Found", results.length, "relevant chunks");

    if (results.length === 0) {
      return "## Relevant Information from Documents\n\nNo relevant documents found in your knowledge base.";
    }

    return formatResultsForContext(results, RAG_CONFIG.DEFAULT_MAX_CONTEXT_TOKENS);
  } catch (error) {
    console.error("[getRAGContext] Error:", error);
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ============================================
    // PAYWALL: Check message allowance
    // ============================================
    const usageCheck = await checkMessageAllowance(session.user.id);

    if (!usageCheck.allowed) {
      console.log("[API] User hit message limit:", session.user.id);
      return new Response(
          JSON.stringify({
            error: "MESSAGE_LIMIT_REACHED",
            message: usageCheck.reason,
            usage: usageCheck.usage,
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          }
      );
    }

    const body = await request.json();
    const {
      message,
      conversationId,
      agent = "technology",
    } = body as {
      message: string;
      conversationId?: string;
      agent?: AgentType;
    };

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = await getDb();
    let currentConversationId = conversationId;
    let conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];

    // Database operations
    if (db) {
      const { conversations, messages } = await getSchema();

      // Get or create conversation
      if (currentConversationId) {
        // Load existing conversation history
        const existingMessages = await db
            .select()
            .from(messages)
            .where(eq(messages.conversationId, currentConversationId))
            .orderBy(messages.createdAt);

        conversationHistory = existingMessages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
      } else {
        // Create new conversation
        const [newConversation] = await db
            .insert(conversations)
            .values({
              userId: session.user.id,
              agent,
              title: message.slice(0, 100), // Use first message as title
            })
            .returning();

        currentConversationId = newConversation.id;
      }

      // Save user message
      await db.insert(messages).values({
        conversationId: currentConversationId,
        role: "user",
        content: message,
      });
    } else {
      // No database - generate a temporary conversation ID
      currentConversationId = currentConversationId || `temp-${Date.now()}`;
    }

    // Add current message to history
    conversationHistory.push({ role: "user", content: message });

    // Fetch user settings for personalization
    const userSettings = await getUserSettings(session.user.id);
    console.log("[API] User ID:", session.user.id);
    console.log("[API] Loaded user settings:", userSettings ? "yes" : "no");
    if (userSettings) {
      console.log("[API] Settings company:", userSettings.companyName);
      console.log("[API] Settings techStack:", userSettings.techStack?.slice(0, 50));
    }

    // ============================================
    // RAG: Fetch document context for Knowledge Base
    // ============================================
    let ragContext: string | undefined;
    if (agent === "knowledge") {
      console.log("[API] Knowledge Base agent - fetching RAG context");

      // Safely get organizationId if it exists on the user object
      const organizationId = (session.user as { organizationId?: string }).organizationId;

      ragContext = await getRAGContext(
          message,
          session.user.id,
          organizationId
      );
      if (ragContext) {
        console.log("[API] RAG context retrieved, length:", ragContext.length);
      }
    }

    // Create streaming response
    const encoder = new TextEncoder();
    let fullResponse = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send conversation ID first
          controller.enqueue(
              encoder.encode(
                  `data: ${JSON.stringify({ type: "conversation_id", id: currentConversationId })}\n\n`
              )
          );

          // Stream the AI response (pass RAG context if available)
          const responseStream = streamConversation({
            messages: conversationHistory,
            agent,
            conversationId: currentConversationId,
            userId: session.user.id,
            settings: userSettings,
            ragContext,
          });

          let chunkIndex = 0;
          for await (const chunk of responseStream) {
            chunkIndex++;
            fullResponse += chunk;
            console.log("[API] Sending chunk", chunkIndex, "length:", chunk.length);
            controller.enqueue(
                encoder.encode(
                    `data: ${JSON.stringify({ type: "content", content: chunk })}\n\n`
                )
            );
          }

          console.log("[API] Stream complete. Total response length:", fullResponse.length);

          // Save assistant message to database
          if (db && currentConversationId) {
            const { conversations, messages } = await getSchema();

            await db.insert(messages).values({
              conversationId: currentConversationId,
              role: "assistant",
              content: fullResponse,
            });

            // Update conversation metadata
            await db
                .update(conversations)
                .set({
                  lastMessageAt: new Date(),
                  messageCount: conversationHistory.length + 1,
                  updatedAt: new Date(),
                })
                .where(eq(conversations.id, currentConversationId));
          }

          // ============================================
          // PAYWALL: Increment usage after successful response
          // ============================================
          try {
            const updatedUsage = await incrementMessageUsage(session.user.id);
            console.log("[API] Usage incremented:", updatedUsage.messagesUsed, "/", updatedUsage.totalAvailable);

            // Send updated usage info to client
            controller.enqueue(
                encoder.encode(
                    `data: ${JSON.stringify({ type: "usage", usage: updatedUsage })}\n\n`
                )
            );
          } catch (usageError) {
            console.error("[API] Failed to increment usage:", usageError);
            // Don't fail the request if usage tracking fails
          }

          // Send completion signal
          controller.enqueue(
              encoder.encode(
                  `data: ${JSON.stringify({ type: "done" })}\n\n`
              )
          );

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.enqueue(
              encoder.encode(
                  `data: ${JSON.stringify({ type: "error", error: "Failed to generate response" })}\n\n`
              )
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no", // Disable nginx buffering
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
    );
  }
}

// GET endpoint to fetch conversation history
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    const db = await getDb();
    if (!db) {
      return new Response(JSON.stringify({ messages: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const { messages, conversations } = await getSchema();

    if (conversationId) {
      // Get specific conversation
      const conversationMessages = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conversationId))
          .orderBy(messages.createdAt);

      return new Response(JSON.stringify({ messages: conversationMessages }), {
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // Get recent conversations
      const recentConversations = await db
          .select()
          .from(conversations)
          .where(eq(conversations.userId, session.user.id))
          .orderBy(desc(conversations.lastMessageAt))
          .limit(20);

      return new Response(
          JSON.stringify({ conversations: recentConversations }),
          { headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Chat GET error:", error);
    return new Response(
        JSON.stringify({ error: "Internal server error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
    );
  }
}