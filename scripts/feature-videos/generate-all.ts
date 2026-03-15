/**
 * Generate individual feature demo videos with voiceover narration.
 *
 * Usage:
 *   npm run generate-feature-videos                    # All 7 features
 *   npm run generate-feature-videos -- --feature=dashboard  # Single feature
 *
 * Prerequisites:
 *   - FFmpeg installed (`brew install ffmpeg`)
 *   - Playwright Chromium installed (`npx playwright install chromium`)
 *   - Narration audio generated (`npm run generate-feature-audio`)
 *
 * Produces MP4 files in public/videos/
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { startDevServer } from "./lib/server";
import { recordFeature } from "./lib/recorder";
import { mergeVideoAudio } from "./lib/ffmpeg";

// Import all feature configs
import { dashboard } from "./features/dashboard";
import { advisorChat } from "./features/advisor-chat";
import { contentEngine } from "./features/content-engine";
import { documents } from "./features/documents";
import { companyLibrary } from "./features/company-library";
import { goals } from "./features/goals";
import { roundtable } from "./features/roundtable";
import type { FeatureConfig } from "./lib/types";

const ALL_FEATURES: FeatureConfig[] = [
  dashboard,
  advisorChat,
  contentEngine,
  documents,
  companyLibrary,
  goals,
  roundtable,
];

const AUDIO_DIR = path.join(process.cwd(), "public", "audio", "feature-demos");
const OUTPUT_DIR = path.join(process.cwd(), "public", "videos");
const TMP_DIR = path.join(process.cwd(), ".tmp-video-gen");
const DEV_PORT = 3099;

function log(msg: string) {
  console.log(`  ${msg}`);
}

async function main() {
  console.log("\n🎬 CEO Sidekick Feature Video Generator\n");

  // Parse --feature flag
  const featureArg = process.argv.find((a) => a.startsWith("--feature="));
  const featureId = featureArg?.split("=")[1];

  const features = featureId
    ? ALL_FEATURES.filter((f) => f.id === featureId)
    : ALL_FEATURES;

  if (features.length === 0) {
    console.error(`❌ Unknown feature: ${featureId}`);
    console.error(
      `   Available: ${ALL_FEATURES.map((f) => f.id).join(", ")}`
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
  for (const feature of features) {
    const audioPath = path.join(AUDIO_DIR, `${feature.id}.mp3`);
    if (!fs.existsSync(audioPath)) {
      console.error(`❌ Missing audio: ${audioPath}`);
      console.error("   Run: npm run generate-feature-audio");
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
    for (let i = 0; i < features.length; i++) {
      const feature = features[i];
      const audioPath = path.join(AUDIO_DIR, `${feature.id}.mp3`);
      const outputPath = path.join(OUTPUT_DIR, `${feature.id}.mp4`);

      console.log(
        `\n🎥 [${i + 1}/${features.length}] Recording: ${feature.title}`
      );

      // Step 1: Record with Playwright
      log("Recording browser...");
      const videoPath = await recordFeature(feature, baseUrl, TMP_DIR);
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
    console.log(`\n✅ Done! ${features.length} video(s) generated:\n`);
    for (const feature of features) {
      const outputPath = path.join(OUTPUT_DIR, `${feature.id}.mp4`);
      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
        console.log(
          `   📹 ${feature.id}.mp4 — ${feature.title} (${sizeMB} MB)`
        );
      }
    }
    console.log("\n   Ready to upload to LinkedIn! 🚀\n");
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
