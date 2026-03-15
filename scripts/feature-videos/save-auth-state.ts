/**
 * Save browser auth state for video recording.
 *
 * Opens a visible Chromium window so you can log in via Google OAuth.
 * After login, saves your session cookies so the recording scripts
 * can reuse them without needing to log in again.
 *
 * Usage:
 *   npm run save-auth-state
 */

import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import http from "http";

const AUTH_STATE_PATH = path.join(
  process.cwd(),
  ".tmp-video-gen",
  "auth-state.json"
);
const DEV_PORT = 3099;

function waitForServer(port: number, timeoutMs = 60_000): Promise<void> {
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

async function main() {
  console.log("\n🔐 Save Auth State for Video Recording\n");

  // Check if dev server is already running on port 3099 or 3000
  let baseUrl = "";
  for (const port of [3099, 3000]) {
    try {
      await waitForServer(port, 3000);
      baseUrl = `http://localhost:${port}`;
      console.log(`  Found dev server on port ${port}`);
      break;
    } catch {
      // Not running on this port
    }
  }

  if (!baseUrl) {
    console.log("  Starting dev server on port 3099...");
    const { spawn } = await import("child_process");
    const devServer = spawn("npx", ["next", "dev", "-p", String(DEV_PORT)], {
      cwd: process.cwd(),
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, NODE_ENV: "development" },
    });
    await waitForServer(DEV_PORT);
    baseUrl = `http://localhost:${DEV_PORT}`;
    console.log("  ✓ Dev server ready");

    // Cleanup on exit
    process.on("exit", () => devServer.kill("SIGTERM"));
  }

  // Create output directory
  fs.mkdirSync(path.dirname(AUTH_STATE_PATH), { recursive: true });

  // Open a VISIBLE browser for manual login
  console.log("\n  Opening browser — please log in with Google...\n");

  const browser = await chromium.launch({
    headless: false,
    channel: "chrome", // Use system Chrome instead of bundled Chromium
    args: ["--window-size=1280,900", "--window-position=100,100"],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();
  page.setDefaultTimeout(120_000);

  // Navigate to the app — it will redirect to login if not authenticated
  try {
    await page.goto(`${baseUrl}/login`, { timeout: 60_000 });
  } catch {
    // Page may redirect (ERR_ABORTED) — that's fine, the browser will follow it
  }

  // Wait for page to settle
  await page.waitForTimeout(3000);

  console.log("  Waiting for you to log in and reach the dashboard...");
  console.log("  (Click 'Continue with Google' and complete the login)\n");

  try {
    await page.waitForURL("**/dashboard**", { timeout: 300_000 }); // 5 min timeout
    console.log("  ✓ Login detected! Saving session...\n");

    // Wait a moment for any post-login setup
    await page.waitForTimeout(2000);

    // Save the storage state (cookies + localStorage)
    await context.storageState({ path: AUTH_STATE_PATH });
    console.log(`  ✓ Auth state saved to: ${AUTH_STATE_PATH}`);
    console.log(
      "\n  You can now close this browser and run:\n    npm run generate-feature-videos\n"
    );
  } catch {
    console.error("\n  ❌ Timed out waiting for login (5 minutes).");
    console.error("  Please try again.");
  }

  await browser.close();
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
