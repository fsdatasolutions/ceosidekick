/**
 * Generate tutorial demo videos with voiceover narration.
 *
 * Usage:
 *   npm run generate-tutorial-videos                          # All tutorials
 *   npm run generate-tutorial-videos -- --tutorial=onboarding # Single tutorial
 *
 * Prerequisites:
 *   - FFmpeg installed (`brew install ffmpeg`)
 *   - Playwright Chromium installed (`npx playwright install chromium`)
 *   - Narration audio generated (`npm run generate-tutorial-audio`)
 *
 * Produces MP4 files in public/videos/tutorials/
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { startDevServer } from "../feature-videos/lib/server";
import { recordFeature } from "../feature-videos/lib/recorder";
import { mergeVideoAudio } from "../feature-videos/lib/ffmpeg";
import type { FeatureConfig } from "../feature-videos/lib/types";

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

const ALL_TUTORIALS: FeatureConfig[] = [
    onboarding,
    settingsPersonalization,
    linkedinPosts,
    bulkCreatePosts,
    contentCampaigns,
    linkedinIntegration,
    schedulingPublishing,
    billingCredits,
];

const AUDIO_DIR = path.join(process.cwd(), "public", "audio", "tutorials");
const OUTPUT_DIR = path.join(process.cwd(), "public", "videos", "tutorials");
const TMP_DIR = path.join(process.cwd(), ".tmp-tutorial-gen");
const DEV_PORT = 3099;

function log(msg: string) {
    console.log(`  ${msg}`);
}

async function main() {
    console.log("\n🎬 CEO Sidekick Tutorial Video Generator\n");

    // Parse --tutorial flag
    const tutorialArg = process.argv.find((a) => a.startsWith("--tutorial="));
    const tutorialId = tutorialArg?.split("=")[1];

    const tutorials = tutorialId
        ? ALL_TUTORIALS.filter((t) => t.id === tutorialId)
        : ALL_TUTORIALS;

    if (tutorials.length === 0) {
        console.error(`❌ Unknown tutorial: ${tutorialId}`);
        console.error(
            `   Available: ${ALL_TUTORIALS.map((t) => t.id).join(", ")}`
        );
        process.exit(1);
    }

    // Verify prerequisites
    try {
        execSync("ffmpeg -version", { stdio: "pipe" });
    } catch {
        console.error("❌ FFmpeg not found. Install with: brew install ffmpeg");
        process.exit(1);
    }

    log("✓ Using credential login (shannonamcgill@gmail.com)");

    // Verify audio files exist
    for (const tutorial of tutorials) {
        const audioPath = path.join(AUDIO_DIR, `${tutorial.id}.mp3`);
        if (!fs.existsSync(audioPath)) {
            console.error(`❌ Missing audio: ${audioPath}`);
            console.error("   Run: npm run generate-tutorial-audio");
            process.exit(1);
        }
    }

    // Setup directories
    fs.mkdirSync(TMP_DIR, { recursive: true });
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    // Start dev server
    console.log("📦 Starting dev server...");
    const devServer = await startDevServer(DEV_PORT, process.cwd());
    log("✓ Dev server ready on port " + DEV_PORT);

    const baseUrl = `http://localhost:${DEV_PORT}`;

    try {
        for (let i = 0; i < tutorials.length; i++) {
            const tutorial = tutorials[i];
            const audioPath = path.join(AUDIO_DIR, `${tutorial.id}.mp3`);
            const outputPath = path.join(OUTPUT_DIR, `${tutorial.id}.mp4`);

            console.log(
                `\n🎥 [${i + 1}/${tutorials.length}] Recording: ${tutorial.title}`
            );

            // Step 1: Record with Playwright
            log("Recording browser...");
            const videoPath = await recordFeature(tutorial, baseUrl, TMP_DIR);
            log("✓ Recording saved");

            // Step 2: Merge video + audio
            log("Merging video and audio...");
            mergeVideoAudio(videoPath, audioPath, outputPath);
            log("✓ MP4 created");

            // Report file size
            const stats = fs.statSync(outputPath);
            const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
            log(`📍 ${outputPath} (${sizeMB} MB)`);
        }

        // Cleanup temp files
        console.log("\n🧹 Cleaning up...");
        fs.rmSync(TMP_DIR, { recursive: true, force: true });
        log("✓ Temporary files removed");

        // Summary
        console.log(`\n✅ Done! ${tutorials.length} tutorial video(s) generated:\n`);
        for (const tutorial of tutorials) {
            const outputPath = path.join(OUTPUT_DIR, `${tutorial.id}.mp4`);
            if (fs.existsSync(outputPath)) {
                const stats = fs.statSync(outputPath);
                const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
                console.log(
                    `   📹 ${tutorial.id}.mp4 — ${tutorial.title} (${sizeMB} MB)`
                );
            }
        }
        console.log("\n   Ready to upload to YouTube! 🚀\n");
    } finally {
        devServer.kill("SIGTERM");
    }
}

main().catch((err) => {
    console.error("\n❌ Error:", err);
    try {
        fs.rmSync(TMP_DIR, { recursive: true, force: true });
    } catch {}
    process.exit(1);
});
