// src/lib/voice-config.ts
// Voice chat configuration - agent voices and pricing

// OpenAI TTS voices: alloy, echo, fable, onyx, nova, shimmer
export type OpenAIVoice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

export interface AgentVoiceConfig {
    voice: OpenAIVoice;
    speed?: number; // 0.25 to 4.0, default 1.0
    description: string;
}

// Map each agent to a distinct voice personality
export const AGENT_VOICES: Record<string, AgentVoiceConfig> = {
    technology: {
        voice: "onyx",
        speed: 1.0,
        description: "Deep and authoritative - your technical advisor",
    },
    coach: {
        voice: "fable",
        speed: 0.95,
        description: "Warm and encouraging - your leadership mentor",
    },
    legal: {
        voice: "echo",
        speed: 0.9,
        description: "Professional and measured - your legal counsel",
    },
    hr: {
        voice: "nova",
        speed: 1.0,
        description: "Friendly and approachable - your people partner",
    },
    marketing: {
        voice: "shimmer",
        speed: 1.05,
        description: "Energetic and creative - your marketing strategist",
    },
    sales: {
        voice: "alloy",
        speed: 1.0,
        description: "Confident and persuasive - your sales advisor",
    },
    knowledge: {
        voice: "alloy",
        speed: 1.0,
        description: "Clear and informative - your knowledge assistant",
    },
    content: {
        voice: "nova",
        speed: 1.0,
        description: "Creative and expressive - your content creator",
    },
};

// Voice message pricing
export const VOICE_CONFIG = {
    // Voice messages cost this many message credits (3x normal)
    MESSAGE_COST_MULTIPLIER: 3,

    // OpenAI TTS model
    TTS_MODEL: "tts-1" as const, // or "tts-1-hd" for higher quality

    // OpenAI Whisper model
    STT_MODEL: "whisper-1" as const,

    // Max audio duration in seconds (to prevent abuse)
    MAX_AUDIO_DURATION_SECONDS: 120,

    // Max response length to synthesize (characters)
    MAX_SYNTHESIS_CHARS: 4096,

    // Audio format for TTS output
    TTS_FORMAT: "mp3" as const, // mp3, opus, aac, flac
};

// Get voice config for an agent
export function getAgentVoice(agentId: string): AgentVoiceConfig {
    return AGENT_VOICES[agentId] || AGENT_VOICES.knowledge;
}

// Calculate message cost for voice
export function getVoiceMessageCost(): number {
    return VOICE_CONFIG.MESSAGE_COST_MULTIPLIER;
}