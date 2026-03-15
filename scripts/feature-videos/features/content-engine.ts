import type { FeatureConfig } from "../lib/types";
import { smoothScroll } from "../lib/recorder";

const NARRATION = `The Content Engine is your AI-powered marketing department. It helps you create professional content at scale. Here on the main page, you can see your content stats at a glance, showing how many images, articles, posts, and blog entries you've created.

You have four content types to work with. Images lets you generate or upload visuals. LinkedIn Articles are for long-form thought leadership. LinkedIn Posts help you create engaging short-form updates. And Web Blogs are for your company website.

Let's look at the LinkedIn Posts section. Here you can see all your posts organized by status — drafts, scheduled, published, and archived. Each post shows a preview of the content and when it was last updated.

Clicking into a post opens the full editor where you can refine the content, copy it to your clipboard, or publish directly. The content engine also supports creating full campaigns, where you enter a brief once and generate coordinated content across images, articles, posts, and blogs all at once. This saves you hours and keeps your messaging consistent across every channel.`;

export const contentEngine: FeatureConfig = {
  id: "content-engine",
  title: "Content Engine",
  route: "/content-engine",
  narration: NARRATION,
  estimatedDurationMs: 92_000,
  actions: [
    {
      timestamp: 4000,
      description: "Scroll to reveal stats cards",
      action: async (page) => {
        await smoothScroll(page, 200);
      },
    },
    {
      timestamp: 10000,
      description: "Hover over Images stat card",
      action: async (page) => {
        const card = page.locator('a[href="/content-engine/images"]').first();
        if (await card.isVisible()) await card.hover();
      },
    },
    {
      timestamp: 14000,
      description: "Hover over LinkedIn Articles card",
      action: async (page) => {
        const card = page.locator('a[href="/content-engine/linkedin-articles"]').first();
        if (await card.isVisible()) await card.hover();
      },
    },
    {
      timestamp: 18000,
      description: "Hover over LinkedIn Posts card",
      action: async (page) => {
        const card = page.locator('a[href="/content-engine/linkedin-posts"]').first();
        if (await card.isVisible()) await card.hover();
      },
    },
    {
      timestamp: 22000,
      description: "Hover over Web Blogs card",
      action: async (page) => {
        const card = page.locator('a[href="/content-engine/web-blogs"]').first();
        if (await card.isVisible()) await card.hover();
      },
    },
    {
      timestamp: 28000,
      description: "Click LinkedIn Posts to navigate",
      action: async (page) => {
        const card = page.locator('a[href="/content-engine/linkedin-posts"]').first();
        if (await card.isVisible()) await card.click();
        await page.waitForLoadState("networkidle");
      },
    },
    {
      timestamp: 34000,
      description: "Scroll through post list",
      action: async (page) => {
        await smoothScroll(page, 400);
      },
    },
    {
      timestamp: 40000,
      description: "Hover over a post in the list",
      action: async (page) => {
        const post = page.locator("a.hover\\:bg-neutral-50, tr.hover\\:bg-neutral-50").first();
        if (await post.isVisible()) await post.hover();
      },
    },
    {
      timestamp: 46000,
      description: "Click into a post",
      action: async (page) => {
        const post = page.locator("a.hover\\:bg-neutral-50, tr.hover\\:bg-neutral-50").first();
        if (await post.isVisible()) await post.click();
        await page.waitForLoadState("networkidle");
      },
    },
    {
      timestamp: 52000,
      description: "Scroll through post content",
      action: async (page) => {
        await smoothScroll(page, 300);
      },
    },
    {
      timestamp: 58000,
      description: "Hover over copy button",
      action: async (page) => {
        const copyBtn = page.locator('button:has-text("Copy")').first();
        if (await copyBtn.isVisible()) await copyBtn.hover();
      },
    },
    {
      timestamp: 62000,
      description: "Navigate back to content engine",
      action: async (page) => {
        await page.goto(`${page.url().split("/content-engine")[0]}/content-engine`, {
          waitUntil: "networkidle",
        });
      },
    },
    {
      timestamp: 68000,
      description: "Scroll to campaign CTA section",
      action: async (page) => {
        await smoothScroll(page, 500);
      },
    },
    {
      timestamp: 74000,
      description: "Hover over Create Campaign button",
      action: async (page) => {
        const btn = page.locator('a[href="/content-engine/create"]').first();
        if (await btn.isVisible()) await btn.hover();
      },
    },
    {
      timestamp: 80000,
      description: "Scroll to recent content",
      action: async (page) => {
        await smoothScroll(page, 400);
      },
    },
  ],
};
