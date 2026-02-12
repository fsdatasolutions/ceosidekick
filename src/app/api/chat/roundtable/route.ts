// src/app/api/chat/roundtable/route.ts
// Round Table API endpoint - orchestrates multi-advisor conversations

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { streamRoundTableConversation } from "@/agents/graph";
import { AgentType } from "@/agents/types";
import { ROUND_TABLE_ELIGIBLE_ADVISORS } from "@/agents/round-table";
import {
    getUserTier,
    checkMessageAllowance,
    incrementMessageUsage,
    getUserUsage,
} from "@/lib/usage";

export const runtime = "nodejs";
export const maxDuration = 120; // Round Table needs more time for parallel calls

// Fetch user settings from DB (same pattern as your existing chat route)
async function getUserSettings(userId: string) {
    try {
        const { db } = await import("@/db");
        const { eq } = await import("drizzle-orm");
        const { userSettings } = await import("@/db/schema");

        const settings = await db
            .select()
            .from(userSettings)
            .where(eq(userSettings.userId, userId))
            .limit(1);

        return settings[0] || null;
    } catch (err) {
        console.warn("[RoundTable API] Failed to fetch settings:", err);
        return null;
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

        // Check message allowance (Round Table uses multiple messages)
        // Minimum cost is 4 (2 advisors + classification + synthesis)
        const allowance = await checkMessageAllowance(userId, 4);
        if (!allowance.allowed) {
            return NextResponse.json(
                {
                    error: allowance.reason || "Message limit reached.",
                    limitReached: true,
                },
                { status: 429 }
            );
        }

        // Parse request
        const body = await req.json();
        const { messages, conversationId, selectedAdvisors } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return NextResponse.json(
                { error: "Messages are required" },
                { status: 400 }
            );
        }

        // Validate selected advisors if provided
        let validatedAdvisors: AgentType[] | undefined;
        if (selectedAdvisors && Array.isArray(selectedAdvisors)) {
            validatedAdvisors = selectedAdvisors.filter((a: string) =>
                ROUND_TABLE_ELIGIBLE_ADVISORS.includes(a as AgentType)
            ) as AgentType[];
            if (validatedAdvisors.length === 0) {
                validatedAdvisors = undefined;
            }
        }

        // Fetch user settings for personalization
        // Convert null values to undefined (DB returns null, UserSettings expects undefined)
        const rawSettings = await getUserSettings(userId);
        const settings = rawSettings
            ? Object.fromEntries(
                Object.entries(rawSettings).map(([key, value]) => [
                    key,
                    value === null ? undefined : value,
                ])
            )
            : undefined;

        // Create streaming response
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    let messagesCharged = 0;

                    const generator = streamRoundTableConversation({
                        messages,
                        conversationId,
                        userId,
                        settings: settings || undefined,
                        selectedAdvisors: validatedAdvisors,
                    });

                    for await (const chunk of generator) {
                        // Parse the synthesis_complete event to get the message charge count
                        const completeMatch = chunk.match(
                            /__RT_EVENT__(.+?"type"\s*:\s*"synthesis_complete".+?)__RT_END__/
                        );
                        if (completeMatch) {
                            try {
                                const event = JSON.parse(completeMatch[1]);
                                const meta = JSON.parse(event.content);
                                messagesCharged = meta.messagesCharged || 0;
                            } catch {}
                        }

                        controller.enqueue(encoder.encode(chunk));
                    }

                    // Increment usage after successful completion
                    if (messagesCharged > 0) {
                        await incrementMessageUsage(userId, messagesCharged);
                        console.log(
                            `[RoundTable API] Charged ${messagesCharged} messages for user ${userId}`
                        );
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
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
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