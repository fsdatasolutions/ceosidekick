// src/app/api/support-chat/route.ts
// Support chatbot API — free, no auth required, rate-limited
// Streams responses using SSE matching the existing chat pattern

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getModel } from "@/lib/ai-models";
import { SUPPORT_KNOWLEDGE } from "@/lib/support-knowledge";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================
// Rate Limiting (in-memory, per IP)
// ============================================

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute

const rateLimitMap = new Map<string, number[]>();

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of rateLimitMap.entries()) {
        const filtered = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
        if (filtered.length === 0) {
            rateLimitMap.delete(key);
        } else {
            rateLimitMap.set(key, filtered);
        }
    }
}, 5 * 60 * 1000);

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const timestamps = rateLimitMap.get(ip) || [];
    const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

    if (recent.length >= RATE_LIMIT_MAX) {
        return false;
    }

    recent.push(now);
    rateLimitMap.set(ip, recent);
    return true;
}

// ============================================
// System Prompt
// ============================================

const SUPPORT_SYSTEM_PROMPT = `You are Robin, the CEO Sidekick Support Assistant — a friendly, helpful chatbot embedded on the CEO Sidekick website.

Your job is to help users understand how to use CEO Sidekick and get the most value from the platform. You answer questions about features, navigation, pricing, and troubleshooting.

RULES:
- ONLY answer questions about CEO Sidekick. If someone asks a general business question, politely redirect them to the appropriate AI advisor (e.g., "That's a great question for our Marketing Partner advisor! Go to Chat → select Marketing Partner.")
- Be concise — aim for 2-4 sentences unless the user needs a detailed explanation.
- Include navigation hints when relevant (e.g., "Go to Settings → Company Profile").
- Be warm and encouraging, especially with new users.
- If you don't know the answer, say so honestly and suggest contacting support.
- Never make up features or pricing that aren't in your knowledge base.
- Format responses with markdown when helpful (bold for emphasis, bullet points for lists).

${SUPPORT_KNOWLEDGE}`;

// ============================================
// Request Types
// ============================================

interface SupportChatBody {
    message: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
    currentPage?: string;
}

// ============================================
// POST Handler
// ============================================

export async function POST(request: NextRequest) {
    // Rate limit by IP
    const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";

    if (!checkRateLimit(ip)) {
        return NextResponse.json(
            { error: "Too many requests. Please wait a moment and try again." },
            { status: 429 }
        );
    }

    try {
        const body = (await request.json()) as SupportChatBody;
        const { message, history = [], currentPage } = body;

        // Input validation
        if (!message || typeof message !== "string" || message.trim().length === 0) {
            return NextResponse.json(
                { error: "Message is required" },
                { status: 400 }
            );
        }

        if (message.length > 2000) {
            return NextResponse.json(
                { error: "Message too long (max 2000 characters)" },
                { status: 400 }
            );
        }

        // Truncate history to last 20 messages
        const truncatedHistory = history.slice(-20);

        // Build messages array
        const messages: Array<{ role: "user" | "assistant"; content: string }> = [];

        for (const msg of truncatedHistory) {
            if (msg.role === "user" || msg.role === "assistant") {
                messages.push({ role: msg.role, content: msg.content });
            }
        }

        // Add current message with optional page context
        let userMessage = message.trim();
        if (currentPage) {
            userMessage += `\n\n[User is currently on page: ${currentPage}]`;
        }
        messages.push({ role: "user", content: userMessage });

        // Create streaming response
        const stream = new ReadableStream({
            async start(controller) {
                const encoder = new TextEncoder();

                try {
                    const response = await anthropic.messages.create({
                        model: getModel("support"),
                        max_tokens: 1024,
                        temperature: 0.3,
                        system: SUPPORT_SYSTEM_PROMPT,
                        messages,
                        stream: true,
                    });

                    for await (const event of response) {
                        if (
                            event.type === "content_block_delta" &&
                            event.delta.type === "text_delta"
                        ) {
                            const data = JSON.stringify({
                                type: "content",
                                content: event.delta.text,
                            });
                            controller.enqueue(
                                encoder.encode(`data: ${data}\n\n`)
                            );
                        }
                    }

                    // Signal completion
                    controller.enqueue(
                        encoder.encode(
                            `data: ${JSON.stringify({ type: "done" })}\n\n`
                        )
                    );
                } catch (error) {
                    console.error("[Support Chat] Streaming error:", error);
                    const errorData = JSON.stringify({
                        type: "error",
                        message: "Sorry, I'm having trouble responding right now. Please try again.",
                    });
                    controller.enqueue(
                        encoder.encode(`data: ${errorData}\n\n`)
                    );
                } finally {
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
        console.error("[Support Chat] Error:", error);
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        );
    }
}
