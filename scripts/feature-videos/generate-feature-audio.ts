/**
 * Generate voiceover narration audio for all 7 feature demo videos.
 *
 * Usage:
 *   npm run generate-feature-audio
 *
 * Produces 7 MP3 files in public/audio/feature-demos/, one per feature.
 * Requires OPENAI_API_KEY in .env or .env.local.
 */

import dotenv from "dotenv";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

// Load env files
dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Import narrations from feature modules
import { dashboard } from "./features/dashboard";
import { advisorChat } from "./features/advisor-chat";
import { contentEngine } from "./features/content-engine";
import { documents } from "./features/documents";
import { companyLibrary } from "./features/company-library";
import { goals } from "./features/goals";
import { roundtable } from "./features/roundtable";

const FEATURES = [
  dashboard,
  advisorChat,
  contentEngine,
  documents,
  companyLibrary,
  goals,
  roundtable,
];

async function generateAudio() {
  const outputDir = path.join(process.cwd(), "public", "audio", "feature-demos");
  fs.mkdirSync(outputDir, { recursive: true });

  console.log("\n🎙️  Generating feature demo narrations\n");

  for (const feature of FEATURES) {
    console.log(`  Generating: ${feature.id} (${feature.title})...`);

    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: feature.narration,
      speed: 1.0,
      response_format: "mp3",
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const filePath = path.join(outputDir, `${feature.id}.mp3`);
    fs.writeFileSync(filePath, buffer);

    const sizeKB = (buffer.length / 1024).toFixed(1);
    console.log(`  ✓ ${feature.id}.mp3 (${sizeKB} KB)`);
  }

  console.log(
    `\n✅ Done! ${FEATURES.length} narration files generated in public/audio/feature-demos/\n`
  );
}

generateAudio().catch((err) => {
  console.error("❌ Error generating audio:", err);
  process.exit(1);
});
