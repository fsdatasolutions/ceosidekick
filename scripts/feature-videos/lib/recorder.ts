import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import type { FeatureConfig } from "./types";

/**
 * Smooth-scroll the page by a given number of pixels.
 */
export async function smoothScroll(
  page: import("playwright").Page,
  pixels: number
): Promise<void> {
  await page.evaluate(
    (px) => window.scrollBy({ top: px, behavior: "smooth" }),
    pixels
  );
}

/**
 * Record a single feature using Playwright.
 *
 * Logs in via credentials (password set by set-video-password.ts).
 */
export async function recordFeature(
  feature: FeatureConfig,
  baseUrl: string,
  tmpDir: string
): Promise<string> {
  const featureTmpDir = path.join(tmpDir, feature.id);
  fs.mkdirSync(featureTmpDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  // Step 1: Log in using a throwaway context (no video recording)
  // This keeps the login screen out of the final video.
  const authContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const authPage = await authContext.newPage();

  const { login } = await import("./auth");
  await login(authPage, baseUrl);

  // Save auth cookies/storage state
  const storageState = await authContext.storageState();
  await authContext.close();

  // Step 2: Create the recording context with the authenticated state
  const recordContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: featureTmpDir,
      size: { width: 1920, height: 1080 },
    },
    storageState,
  });
  const page = await recordContext.newPage();

  // Navigate directly to feature route (already authenticated)
  await page.goto(`${baseUrl}${feature.route}`, {
    waitUntil: "networkidle",
  });

  // Wait a moment for the page to fully render
  await page.waitForTimeout(2000);

  // Execute timed actions
  let lastTimestamp = 0;
  for (const timedAction of feature.actions) {
    const delay = timedAction.timestamp - lastTimestamp;
    if (delay > 0) {
      await page.waitForTimeout(delay);
    }
    console.log(
      `    [${(timedAction.timestamp / 1000).toFixed(1)}s] ${timedAction.description}`
    );
    try {
      await timedAction.action(page);
    } catch (err) {
      console.warn(
        `    ⚠ Action failed: ${timedAction.description} — ${err instanceof Error ? err.message : err}`
      );
    }
    lastTimestamp = timedAction.timestamp;
  }

  // Hold for remaining duration
  const remainingMs = feature.estimatedDurationMs - lastTimestamp;
  if (remainingMs > 0) {
    await page.waitForTimeout(remainingMs);
  }

  // Finalize video
  const video = page.video();
  await page.close();

  const videoPath = path.join(featureTmpDir, "recording.webm");
  if (video) {
    const savedPath = await video.path();
    if (savedPath && fs.existsSync(savedPath)) {
      fs.renameSync(savedPath, videoPath);
    }
  }

  await recordContext.close();
  await browser.close();

  return videoPath;
}
