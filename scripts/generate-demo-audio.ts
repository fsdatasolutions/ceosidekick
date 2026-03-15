/**
 * Generate demo voiceover audio files using OpenAI TTS.
 *
 * Usage:
 *   npm run generate-demo-audio
 *
 * Produces 7 MP3 files in public/audio/demo/, one per carousel screen.
 * Requires OPENAI_API_KEY in .env or .env.local.
 */

import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

// Load .env.local first (where OPENAI_API_KEY lives), then .env as fallback
dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const DEMO_NARRATIONS = [
  {
    id: "dashboard",
    text: "Your personalized dashboard gives you instant access to AI advisors, content tools, documents, and goal tracking — all in one place.",
  },
  {
    id: "advisor-chat",
    text: "Chat one-on-one with specialized AI advisors. Get tailored tech, marketing, and strategy guidance for your specific business.",
  },
  {
    id: "content-engine",
    text: "Generate polished LinkedIn posts, blog articles, and newsletters in seconds. Just enter a topic and let AI do the writing.",
  },
  {
    id: "documents",
    text: "Create business plans, pitch decks, and proposals from templates. Your documents are generated and ready to customize instantly.",
  },
  {
    id: "company-library",
    text: "Upload your company documents and build a searchable knowledge base. Your AI advisors use this context to give smarter answers.",
  },
  {
    id: "goals",
    text: "Set business goals with AI-generated action plans. Track your progress and stay accountable with step-by-step milestones.",
  },
  {
    id: "roundtable",
    text: "Bring multiple advisors together for a round table discussion. Get synthesized insights from different expert perspectives at once.",
  },
];

async function generateAudio() {
  const outputDir = path.join(process.cwd(), "public", "audio", "demo");
  fs.mkdirSync(outputDir, { recursive: true });

  for (const narration of DEMO_NARRATIONS) {
    console.log(`Generating audio for: ${narration.id}...`);

    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: narration.text,
      speed: 1.0,
      response_format: "mp3",
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const filePath = path.join(outputDir, `${narration.id}.mp3`);
    fs.writeFileSync(filePath, buffer);
    console.log(`  ✓ ${narration.id}.mp3 (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  console.log("\nDone! All demo audio files generated in public/audio/demo/");
}

generateAudio().catch((err) => {
  console.error("Error generating audio:", err);
  process.exit(1);
});
