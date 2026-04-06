/**
 * Generate voiceover narration audio for all tutorial videos.
 *
 * Usage:
 *   npm run generate-tutorial-audio
 *
 * Produces MP3 files in public/audio/tutorials/, one per tutorial.
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

// Import all tutorial configs
import {
    onboarding,
    settingsPersonalization,
    linkedinPosts,
    bulkCreatePosts,
    contentCampaigns,
    linkedinIntegration,
    schedulingPublishing,
    billingCredits,
} from "./index";

const TUTORIALS = [
    onboarding,
    settingsPersonalization,
    linkedinPosts,
    bulkCreatePosts,
    contentCampaigns,
    linkedinIntegration,
    schedulingPublishing,
    billingCredits,
];

async function generateAudio() {
    const outputDir = path.join(process.cwd(), "public", "audio", "tutorials");
    fs.mkdirSync(outputDir, { recursive: true });

    console.log("\n🎙️  Generating tutorial narrations\n");

    for (const tutorial of TUTORIALS) {
        console.log(`  Generating: ${tutorial.id} (${tutorial.title})...`);

        const response = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: tutorial.narration,
            speed: 1.0,
            response_format: "mp3",
        });

        const buffer = Buffer.from(await response.arrayBuffer());
        const filePath = path.join(outputDir, `${tutorial.id}.mp3`);
        fs.writeFileSync(filePath, buffer);

        const sizeKB = (buffer.length / 1024).toFixed(1);
        console.log(`  ✓ ${tutorial.id}.mp3 (${sizeKB} KB)`);
    }

    console.log(
        `\n✅ Done! ${TUTORIALS.length} narration files generated in public/audio/tutorials/\n`
    );
}

generateAudio().catch((err) => {
    console.error("❌ Error generating audio:", err);
    process.exit(1);
});
