// src/app/api/voice/synthesize/route.ts
// Text-to-speech using OpenAI TTS

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import OpenAI from "openai";
import { VOICE_CONFIG, getAgentVoice } from "@/lib/voice-config";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        // Check authentication
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if OpenAI is configured
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: "Voice features not configured" },
                { status: 503 }
            );
        }

        const body = await request.json();
        const { text, agent = "knowledge" } = body as {
            text: string;
            agent?: string;
        };

        if (!text || typeof text !== "string") {
            return NextResponse.json(
                { error: "Text is required" },
                { status: 400 }
            );
        }

        // Limit text length to prevent abuse
        if (text.length > VOICE_CONFIG.MAX_SYNTHESIS_CHARS) {
            return NextResponse.json(
                { error: `Text too long. Maximum ${VOICE_CONFIG.MAX_SYNTHESIS_CHARS} characters.` },
                { status: 400 }
            );
        }

        // Get agent's voice configuration
        const voiceConfig = getAgentVoice(agent);

        console.log("[Synthesize] Generating audio:", {
            agent,
            voice: voiceConfig.voice,
            textLength: text.length,
        });

        // Clean text for better TTS output
        const cleanedText = cleanTextForSpeech(text);

        // Generate speech with OpenAI TTS
        const response = await openai.audio.speech.create({
            model: VOICE_CONFIG.TTS_MODEL,
            voice: voiceConfig.voice,
            input: cleanedText,
            speed: voiceConfig.speed || 1.0,
            response_format: VOICE_CONFIG.TTS_FORMAT,
        });

        // Get audio as buffer
        const audioBuffer = Buffer.from(await response.arrayBuffer());

        console.log("[Synthesize] Success, audio size:", audioBuffer.length);

        // Return audio with appropriate headers
        return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
                "Content-Type": `audio/${VOICE_CONFIG.TTS_FORMAT}`,
                "Content-Length": audioBuffer.length.toString(),
                "Cache-Control": "no-cache",
            },
        });
    } catch (error) {
        console.error("[Synthesize] Error:", error);

        // Handle specific OpenAI errors
        if (error instanceof OpenAI.APIError) {
            return NextResponse.json(
                { error: `Speech synthesis failed: ${error.message}` },
                { status: error.status || 500 }
            );
        }

        return NextResponse.json(
            { error: "Failed to synthesize speech" },
            { status: 500 }
        );
    }
}

/**
 * Clean text for better text-to-speech output
 * - Removes markdown formatting
 * - Handles code blocks
 * - Improves readability
 */
function cleanTextForSpeech(text: string): string {
    let cleaned = text;

    // Remove code blocks entirely (they don't sound good)
    cleaned = cleaned.replace(/```[\s\S]*?```/g, "I've included a code example in my response.");

    // Remove inline code
    cleaned = cleaned.replace(/`([^`]+)`/g, "$1");

    // Remove markdown headers (## Header -> Header)
    cleaned = cleaned.replace(/^#{1,6}\s+/gm, "");

    // Remove bold/italic markers
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1");
    cleaned = cleaned.replace(/\*([^*]+)\*/g, "$1");
    cleaned = cleaned.replace(/__([^_]+)__/g, "$1");
    cleaned = cleaned.replace(/_([^_]+)_/g, "$1");

    // Convert bullet points to spoken form
    cleaned = cleaned.replace(/^[-*]\s+/gm, "• ");

    // Convert numbered lists
    cleaned = cleaned.replace(/^\d+\.\s+/gm, "");

    // Remove links but keep text
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

    // Remove horizontal rules
    cleaned = cleaned.replace(/^[-*_]{3,}$/gm, "");

    // Collapse multiple newlines
    cleaned = cleaned.replace(/\n{3,}/g, "\n\n");

    // Trim whitespace
    cleaned = cleaned.trim();

    return cleaned;
}