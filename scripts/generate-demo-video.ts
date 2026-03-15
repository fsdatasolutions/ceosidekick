/**
 * Generate a shareable demo video (MP4) with voiceover audio.
 *
 * Usage:
 *   npm run generate-demo-video
 *
 * Prerequisites:
 *   - FFmpeg installed (`brew install ffmpeg`)
 *   - Playwright Chromium installed (`npx playwright install chromium`)
 *   - Audio files already generated (`npm run generate-demo-audio`)
 *
 * Produces: public/videos/ceosidekick-demo.mp4
 */

import { chromium } from "playwright";
import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import http from "http";

// ─── Screen config (must match ProductDemo's screens array) ───
const SCREENS = [
  { id: "dashboard", duration: 9500 },
  { id: "advisor-chat", duration: 9500 },
  { id: "content-engine", duration: 9000 },
  { id: "documents", duration: 9000 },
  { id: "company-library", duration: 9000 },
  { id: "goals", duration: 9000 },
  { id: "roundtable", duration: 10000 },
];

const TOTAL_DURATION_MS = SCREENS.reduce((sum, s) => sum + s.duration, 0);
const AUDIO_DIR = path.join(process.cwd(), "public", "audio", "demo");
const TMP_DIR = path.join(process.cwd(), ".tmp-video-gen");
const OUTPUT_DIR = path.join(process.cwd(), "public", "videos");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "ceosidekick-demo.mp4");
const DEV_PORT = 3099; // Use a dedicated port to avoid conflicts

// ─── Helpers ───

function log(msg: string) {
  console.log(`  ${msg}`);
}

/** Wait for the dev server to respond to HTTP requests */
function waitForServer(
  port: number,
  timeoutMs = 60_000
): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Dev server did not start within ${timeoutMs}ms`));
        } else {
          setTimeout(check, 500);
        }
      });
      req.end();
    };

    check();
  });
}

/** Run an ffmpeg command and return stdout */
function ffmpeg(args: string[]): string {
  const cmd = `ffmpeg ${args.join(" ")}`;
  log(`Running: ${cmd}`);
  return execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] });
}

// ─── Main pipeline ───

async function main() {
  console.log("\n🎬 CEO Sidekick Demo Video Generator\n");

  // Verify prerequisites
  try {
    execSync("ffmpeg -version", { stdio: "pipe" });
  } catch {
    console.error("❌ FFmpeg not found. Install with: brew install ffmpeg");
    process.exit(1);
  }

  // Verify audio files exist
  for (const screen of SCREENS) {
    const audioPath = path.join(AUDIO_DIR, `${screen.id}.mp3`);
    if (!fs.existsSync(audioPath)) {
      console.error(`❌ Missing audio file: ${audioPath}`);
      console.error("   Run: npm run generate-demo-audio");
      process.exit(1);
    }
  }

  // Setup directories
  fs.mkdirSync(TMP_DIR, { recursive: true });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // ── Step 1: Start dev server ──
  console.log("📦 Step 1: Starting dev server...");
  const devServer = spawn("npx", ["next", "dev", "-p", String(DEV_PORT)], {
    cwd: process.cwd(),
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "development" },
  });

  // Forward server stderr for debugging
  let serverOutput = "";
  devServer.stdout?.on("data", (data) => {
    serverOutput += data.toString();
  });
  devServer.stderr?.on("data", (data) => {
    serverOutput += data.toString();
  });

  try {
    await waitForServer(DEV_PORT);
    log("✓ Dev server ready");

    // ── Step 2: Record with Playwright ──
    console.log("\n🎥 Step 2: Recording demo with Playwright...");
    const videoPath = path.join(TMP_DIR, "recording.webm");

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: {
        dir: TMP_DIR,
        size: { width: 1920, height: 1080 },
      },
    });

    const page = await context.newPage();
    await page.goto(`http://localhost:${DEV_PORT}/demo-recording`, {
      waitUntil: "networkidle",
    });

    log(`Waiting ${TOTAL_DURATION_MS / 1000}s for carousel to complete...`);

    // Wait for the full carousel cycle + a small buffer
    await page.waitForTimeout(TOTAL_DURATION_MS + 3000);

    // Close page to finalize video
    const video = page.video();
    await page.close();

    if (video) {
      const savedPath = await video.path();
      if (savedPath && fs.existsSync(savedPath)) {
        fs.renameSync(savedPath, videoPath);
      }
    }

    await context.close();
    await browser.close();
    log("✓ Recording saved");

    // ── Step 3: Build audio track with FFmpeg ──
    console.log("\n🔊 Step 3: Building audio track...");

    // Calculate start offsets for each clip
    let offset = 0;
    const audioInputs: string[] = [];
    const filterParts: string[] = [];

    for (let i = 0; i < SCREENS.length; i++) {
      const screen = SCREENS[i];
      const audioFile = path.join(AUDIO_DIR, `${screen.id}.mp3`);
      audioInputs.push(`-i "${audioFile}"`);

      // adelay filter positions each clip at the correct timestamp
      // adelay takes milliseconds, and we pad with silence using apad
      filterParts.push(
        `[${i}:a]adelay=${offset}|${offset},apad[a${i}]`
      );

      offset += screen.duration;
    }

    // Mix all delayed clips together
    const mixInputs = SCREENS.map((_, i) => `[a${i}]`).join("");
    const filterComplex = [
      ...filterParts,
      `${mixInputs}amix=inputs=${SCREENS.length}:duration=longest[aout]`,
    ].join(";");

    const combinedAudioPath = path.join(TMP_DIR, "combined-audio.aac");

    ffmpeg([
      ...audioInputs,
      `-filter_complex "${filterComplex}"`,
      `-map "[aout]"`,
      `-c:a aac -b:a 192k`,
      `-t ${(TOTAL_DURATION_MS + 3000) / 1000}`,
      `-y "${combinedAudioPath}"`,
    ]);

    log("✓ Audio track assembled");

    // ── Step 4: Merge video + audio into MP4 ──
    console.log("\n🎞️  Step 4: Merging video and audio...");

    ffmpeg([
      `-i "${videoPath}"`,
      `-i "${combinedAudioPath}"`,
      `-c:v libx264 -preset medium -crf 23`,
      `-c:a aac -b:a 192k`,
      `-movflags +faststart`,
      `-shortest`,
      `-y "${OUTPUT_FILE}"`,
    ]);

    log("✓ MP4 created");

    // ── Step 5: Cleanup ──
    console.log("\n🧹 Step 5: Cleaning up...");
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
    log("✓ Temporary files removed");

    // Output info
    const stats = fs.statSync(OUTPUT_FILE);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);

    console.log(`\n✅ Done! Video generated successfully.`);
    console.log(`   📍 ${OUTPUT_FILE}`);
    console.log(`   📐 1920×1080 (Full HD)`);
    console.log(`   ⏱  ~${Math.round(TOTAL_DURATION_MS / 1000)}s`);
    console.log(`   📦 ${sizeMB} MB`);
    console.log(`\n   Ready to upload to LinkedIn! 🚀\n`);
  } finally {
    // Kill the dev server
    devServer.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error("\n❌ Error generating video:", err);
  // Cleanup on error
  try {
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
  } catch {}
  process.exit(1);
});
