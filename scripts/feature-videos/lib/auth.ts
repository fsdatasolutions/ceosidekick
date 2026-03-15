import type { Page } from "playwright";

// Real user account (password set by set-video-password.ts)
const VIDEO_EMAIL = "shannonamcgill@gmail.com";
const VIDEO_PASSWORD = "video-recording-temp-2024";

// Fallback demo user
const DEMO_EMAIL = "demo@ceosidekick.biz";
const DEMO_PASSWORD = "password123";

/**
 * Log in via the credentials form.
 * Tries the real user first, falls back to demo user.
 * Waits for redirect to /dashboard before returning.
 */
export async function login(page: Page, baseUrl: string): Promise<void> {
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });

  // Try real user first
  console.log(`    Logging in as ${VIDEO_EMAIL}...`);
  await page.fill('input[type="email"]', VIDEO_EMAIL);
  await page.fill('input[type="password"]', VIDEO_PASSWORD);
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL("**/dashboard**", { timeout: 15_000 });
    await page.waitForLoadState("networkidle");
    console.log(`    ✓ Logged in as ${VIDEO_EMAIL}`);
    return;
  } catch {
    console.warn(
      `    ⚠ Could not log in as ${VIDEO_EMAIL}, trying demo user...`
    );
  }

  // Fallback to demo user
  await page.goto(`${baseUrl}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', DEMO_EMAIL);
  await page.fill('input[type="password"]', DEMO_PASSWORD);
  await page.click('button[type="submit"]');

  await page.waitForURL("**/dashboard**", { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  console.log(`    ✓ Logged in as ${DEMO_EMAIL} (fallback)`);
}
