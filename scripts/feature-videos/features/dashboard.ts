import type { FeatureConfig } from "../lib/types";
import { smoothScroll } from "../lib/recorder";

const NARRATION = `Welcome to CEO Sidekick — your AI-powered command center for running a business. When you log in, you land on your personalized dashboard. Up top, you can see quick stats showing your credit usage, active conversations, and documents in your library. These give you an instant pulse on your activity.

Below that, you'll find your tools grid. This is your launch pad for everything CEO Sidekick offers. You can jump into one-on-one chats with AI advisors, generate professional documents from templates, manage your company library, create marketing content with the content engine, set and track business goals, or start a round table discussion with multiple advisors at once.

Scrolling down, you'll see your AI advisor team. CEO Sidekick gives you specialized advisors covering technology, executive coaching, legal, HR, marketing, sales, and content creation. Each one is trained for its domain and personalized to your business context.

Finally, your recent conversations are always at your fingertips, so you can pick up right where you left off. The dashboard keeps everything organized and accessible, so you spend less time navigating and more time growing your business.`;

export const dashboard: FeatureConfig = {
  id: "dashboard",
  title: "Dashboard Overview",
  route: "/dashboard",
  narration: NARRATION,
  estimatedDurationMs: 90_000,
  actions: [
    {
      timestamp: 3000,
      description: "Slow scroll to reveal stats row",
      action: async (page) => {
        await smoothScroll(page, 200);
      },
    },
    {
      timestamp: 8000,
      description: "Hover over credits stat card",
      action: async (page) => {
        const card = page.locator('[role="progressbar"]').first();
        if (await card.isVisible()) await card.hover();
      },
    },
    {
      timestamp: 12000,
      description: "Scroll down to tools grid",
      action: async (page) => {
        await smoothScroll(page, 300);
      },
    },
    {
      timestamp: 16000,
      description: "Hover over Chat with Advisors card",
      action: async (page) => {
        const card = page.locator('a[href="/chat"]').first();
        if (await card.isVisible()) await card.hover();
      },
    },
    {
      timestamp: 20000,
      description: "Hover over Templates card",
      action: async (page) => {
        const card = page.locator('a[href="/documents"]').first();
        if (await card.isVisible()) await card.hover();
      },
    },
    {
      timestamp: 24000,
      description: "Hover over Company Library card",
      action: async (page) => {
        const card = page.locator('a[href="/knowledge-base"]').first();
        if (await card.isVisible()) await card.hover();
      },
    },
    {
      timestamp: 28000,
      description: "Hover over Content Engine card",
      action: async (page) => {
        const card = page.locator('a[href="/content-engine"]').first();
        if (await card.isVisible()) await card.hover();
      },
    },
    {
      timestamp: 32000,
      description: "Hover over Goals card",
      action: async (page) => {
        const card = page.locator('a[href="/goals"]').first();
        if (await card.isVisible()) await card.hover();
      },
    },
    {
      timestamp: 36000,
      description: "Hover over Round Table card",
      action: async (page) => {
        const card = page.locator('a[href="/roundtable"]').first();
        if (await card.isVisible()) await card.hover();
      },
    },
    {
      timestamp: 42000,
      description: "Scroll down to AI Advisors section",
      action: async (page) => {
        await smoothScroll(page, 500);
      },
    },
    {
      timestamp: 48000,
      description: "Hover over first advisor card",
      action: async (page) => {
        const card = page.locator('a[href*="/chat?agent="]').first();
        if (await card.isVisible()) await card.hover();
      },
    },
    {
      timestamp: 52000,
      description: "Hover over second advisor card",
      action: async (page) => {
        const card = page.locator('a[href*="/chat?agent="]').nth(1);
        if (await card.isVisible()) await card.hover();
      },
    },
    {
      timestamp: 56000,
      description: "Hover over third advisor card",
      action: async (page) => {
        const card = page.locator('a[href*="/chat?agent="]').nth(2);
        if (await card.isVisible()) await card.hover();
      },
    },
    {
      timestamp: 62000,
      description: "Scroll down to Recent Conversations",
      action: async (page) => {
        await smoothScroll(page, 500);
      },
    },
    {
      timestamp: 68000,
      description: "Hover over first recent conversation",
      action: async (page) => {
        const conv = page.locator('a[href*="/chat?agent="][href*="&id="]').first();
        if (await conv.isVisible()) await conv.hover();
      },
    },
    {
      timestamp: 75000,
      description: "Scroll back to top",
      action: async (page) => {
        await page.evaluate(() =>
          window.scrollTo({ top: 0, behavior: "smooth" })
        );
      },
    },
  ],
};
