// src/app/api/chat/roundtable/route.ts
// Round Table API endpoint - orchestrates multi-advisor conversations with persistence

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { streamRoundTableConversation } from "@/agents/graph";
import { AgentType } from "@/agents/types";
import { ROUND_TABLE_ELIGIBLE_ADVISORS } from "@/agents/round-table";
import { eq } from "drizzle-orm";
import {
    getUserTier,
    checkCreditAllowance,
    incrementCreditUsage,
} from "@/lib/usage";
import { tokensToCredits } from "@/lib/credits";

export const runtime = "nodejs";
export const maxDuration = 120;

// Lazy database imports (same pattern as chat route)
async function getDb() {
    if (!process.env.DATABASE_URL) return null;
    const { db } = await import("@/db");
    return db;
}

async function getSchema() {
    const { conversations, messages, userSettings } = await import("@/db/schema");
    return { conversations, messages, userSettings };
}

// Fetch user settings (convert null → undefined for type compatibility)
async function getUserSettings(userId: string) {
    const db = await getDb();
    if (!db) return undefined;

    try {
        const { userSettings } = await getSchema();
        const settings = await db
            .select()
            .from(userSettings)
            .where(eq(userSettings.userId, userId))
            .limit(1);

        if (settings.length === 0) return undefined;

        const s = settings[0];
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
    } catch (err) {
        console.warn("[RoundTable API] Failed to fetch settings:", err);
        return undefined;
    }
}

export async function POST(req: NextRequest) {
    try {
        // Auth check
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Tier check — Round Table is paid-only
        const tier = await getUserTier(userId);
        if (tier === "free") {
            return NextResponse.json(
                {
                    error: "Round Table is available on PowerUser and Pro plans",
                    upgradeRequired: true,
                },
                { status: 403 }
            );
        }

        // Check credit allowance (pre-check with minimum 1 credit)
        const allowance = await checkCreditAllowance(userId, 1);
        if (!allowance.allowed) {
            return NextResponse.json(
                {
                    error: allowance.reason || "Credit limit reached.",
                    limitReached: true,
                },
                { status: 429 }
            );
        }

        // Parse request
        const body = await req.json();
        const { messages: clientMessages, conversationId, selectedAdvisors } = body;

        if (!clientMessages || !Array.isArray(clientMessages) || clientMessages.length === 0) {
            return NextResponse.json(
                { error: "Messages are required" },
                { status: 400 }
            );
        }

        // Validate selected advisors
        let validatedAdvisors: AgentType[] | undefined;
        if (selectedAdvisors && Array.isArray(selectedAdvisors)) {
            validatedAdvisors = selectedAdvisors.filter((a: string) =>
                ROUND_TABLE_ELIGIBLE_ADVISORS.includes(a as AgentType)
            ) as AgentType[];
            if (validatedAdvisors.length === 0) validatedAdvisors = undefined;
        }

        // ============================================
        // DATABASE: Get or create conversation, load history
        // ============================================
        const db = await getDb();
        let currentConversationId = conversationId;
        let conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];

        // The latest user message is the last one in the clientMessages array
        const latestUserMessage = clientMessages[clientMessages.length - 1]?.content || "";

        if (db) {
            const { conversations, messages } = await getSchema();

            if (currentConversationId) {
                // Load existing conversation history from DB
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
                        userId,
                        agent: "roundtable",
                        title: latestUserMessage.slice(0, 100),
                    })
                    .returning();

                currentConversationId = newConversation.id;
            }

            // Save the user message
            await db.insert(messages).values({
                conversationId: currentConversationId,
                role: "user",
                content: latestUserMessage,
            });
        } else {
            currentConversationId = currentConversationId || `temp-${Date.now()}`;
        }

        // Add current message to history for the AI
        conversationHistory.push({ role: "user", content: latestUserMessage });

        // Fetch user settings
        const settings = await getUserSettings(userId);

        // ============================================
        // STREAM: Create response
        // ============================================
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    let totalTokensUsed = 0;
                    let synthesisContent = "";
                    const advisorResponsesMeta: Array<{
                        advisorId: string;
                        advisorName: string;
                        response: string;
                        relevanceScore: number;
                        tokensUsed: number;
                    }> = [];

                    // Send conversation ID first (matches chat route pattern)
                    const idEvent = JSON.stringify({
                        type: "conversation_id",
                        id: currentConversationId,
                    });
                    controller.enqueue(
                        encoder.encode(`__RT_EVENT__${idEvent}__RT_END__`)
                    );

                    const generator = streamRoundTableConversation({
                        messages: conversationHistory,
                        conversationId: currentConversationId,
                        userId,
                        settings: settings || undefined,
                        selectedAdvisors: validatedAdvisors,
                    });

                    for await (const chunk of generator) {
                        // Track synthesis content for DB save
                        const synthChunkMatch = chunk.match(
                            /__RT_EVENT__(.+?"type"\s*:\s*"synthesis_chunk".+?)__RT_END__/
                        );
                        if (synthChunkMatch) {
                            try {
                                const event = JSON.parse(synthChunkMatch[1]);
                                synthesisContent += event.content || "";
                            } catch {}
                        }

                        // Track advisor responses for metadata
                        const advisorCompleteMatch = chunk.match(
                            /__RT_EVENT__(.+?"type"\s*:\s*"advisor_complete".+?)__RT_END__/
                        );
                        if (advisorCompleteMatch) {
                            try {
                                const event = JSON.parse(advisorCompleteMatch[1]);
                                advisorResponsesMeta.push({
                                    advisorId: event.advisorId,
                                    advisorName: event.advisorName,
                                    response: event.content,
                                    relevanceScore: event.relevanceScore,
                                    tokensUsed: event.tokensUsed,
                                });
                            } catch {}
                        }

                        // Track total tokens used
                        const completeMatch = chunk.match(
                            /__RT_EVENT__(.+?"type"\s*:\s*"synthesis_complete".+?)__RT_END__/
                        );
                        if (completeMatch) {
                            try {
                                const event = JSON.parse(completeMatch[1]);
                                const meta = JSON.parse(event.content);
                                totalTokensUsed = meta.totalTokensUsed || 0;
                            } catch {}
                        }

                        controller.enqueue(encoder.encode(chunk));
                    }

                    // ============================================
                    // DATABASE: Save assistant response + metadata
                    // ============================================
                    if (db && currentConversationId && synthesisContent) {
                        const { conversations, messages } = await getSchema();

                        // Save assistant message with Round Table metadata
                        await db.insert(messages).values({
                            conversationId: currentConversationId,
                            role: "assistant",
                            content: synthesisContent,
                            metadata: {
                                type: "roundtable",
                                advisors: advisorResponsesMeta,
                                totalTokensUsed,
                                selectedAdvisors: validatedAdvisors || "auto",
                            },
                        });

                        // Update conversation metadata
                        const totalMessages = conversationHistory.length + 1;
                        await db
                            .update(conversations)
                            .set({
                                lastMessageAt: new Date(),
                                messageCount: totalMessages,
                                updatedAt: new Date(),
                            })
                            .where(eq(conversations.id, currentConversationId));
                    }

                    // ============================================
                    // USAGE: Deduct token-scaled credits after completion
                    // ============================================
                    if (totalTokensUsed > 0) {
                        try {
                            const creditsCharged = tokensToCredits(totalTokensUsed);
                            const updatedUsage = await incrementCreditUsage(userId, creditsCharged);
                            console.log(
                                `[RoundTable API] Charged ${creditsCharged} credits (${totalTokensUsed} tokens) for user ${userId}. Usage: ${updatedUsage.creditsUsed}/${updatedUsage.totalAvailable}`
                            );

                            // Send usage update to client
                            const usageEvent = JSON.stringify({
                                type: "usage_update",
                                usage: updatedUsage,
                                creditsCharged,
                            });
                            controller.enqueue(
                                encoder.encode(`__RT_EVENT__${usageEvent}__RT_END__`)
                            );
                        } catch (usageError) {
                            console.error("[RoundTable API] Failed to deduct credits:", usageError);
                        }
                    }

                    controller.close();
                } catch (error) {
                    console.error("[RoundTable API] Stream error:", error);
                    const errorEvent = JSON.stringify({
                        type: "error",
                        error: "An error occurred during the Round Table discussion",
                    });
                    controller.enqueue(
                        encoder.encode(`__RT_EVENT__${errorEvent}__RT_END__`)
                    );
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
                "X-Accel-Buffering": "no",
            },
        });
    } catch (error) {
        console.error("[RoundTable API] Error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}