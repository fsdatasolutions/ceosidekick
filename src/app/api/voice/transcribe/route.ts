// src/app/api/voice/transcribe/route.ts
// Speech-to-text using OpenAI Whisper

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import OpenAI from "openai";
import { VOICE_CONFIG } from "@/lib/voice-config";

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

        // Get audio file from form data
        const formData = await request.formData();
        const audioFile = formData.get("audio") as File | null;

        if (!audioFile) {
            return NextResponse.json(
                { error: "No audio file provided" },
                { status: 400 }
            );
        }

        // Validate file type
        const validTypes = ["audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/m4a", "audio/ogg"];
        if (!validTypes.some(type => audioFile.type.startsWith(type.split('/')[0]))) {
            return NextResponse.json(
                { error: "Invalid audio format. Supported: webm, mp4, mp3, wav, m4a, ogg" },
                { status: 400 }
            );
        }

        // Check file size (max 25MB for Whisper)
        const maxSize = 25 * 1024 * 1024; // 25MB
        if (audioFile.size > maxSize) {
            return NextResponse.json(
                { error: "Audio file too large. Maximum size is 25MB." },
                { status: 400 }
            );
        }

        console.log("[Transcribe] Processing audio:", {
            type: audioFile.type,
            size: audioFile.size,
            name: audioFile.name,
        });

        // Convert File to the format OpenAI expects
        const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

        // Create a File object that OpenAI can accept
        const file = new File([audioBuffer], audioFile.name || "audio.webm", {
            type: audioFile.type,
        });

        // Transcribe with Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: file,
            model: VOICE_CONFIG.STT_MODEL,
            language: "en", // Optional: auto-detect if removed
            response_format: "json",
        });

        console.log("[Transcribe] Success:", transcription.text.slice(0, 100));

        return NextResponse.json({
            text: transcription.text,
            success: true,
        });
    } catch (error) {
        console.error("[Transcribe] Error:", error);

        // Handle specific OpenAI errors
        if (error instanceof OpenAI.APIError) {
            return NextResponse.json(
                { error: `Transcription failed: ${error.message}` },
                { status: error.status || 500 }
            );
        }

        return NextResponse.json(
            { error: "Failed to transcribe audio" },
            { status: 500 }
        );
    }
}