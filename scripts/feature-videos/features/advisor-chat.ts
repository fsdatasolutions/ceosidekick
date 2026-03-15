import type { FeatureConfig } from "../lib/types";
import { smoothScroll } from "../lib/recorder";

const NARRATION = `The AI Advisor Chat is where you get one-on-one guidance from specialized advisors. On the left, you have your conversation sidebar showing your chat history. You can start a new conversation anytime or pick up a previous one.

At the top, you can choose which advisor to speak with. Each advisor has deep expertise in their domain. The Technology Partner acts as your virtual CTO, helping with tech stack decisions and digital transformation. The Executive Coach supports your leadership development. The Legal Advisor helps with contracts and compliance. You also have HR, Marketing, and Sales partners.

When you open a conversation, you'll see the full message thread with rich formatting. The advisor remembers your business context from your settings, so every response is tailored to your specific situation.

Notice the suggested prompts that appear when you start a new chat. These are designed to help you get the most value quickly. You can also toggle voice mode for hands-free interaction. Every conversation is saved and searchable, building an ongoing knowledge base of advice specific to your business.`;

export const advisorChat: FeatureConfig = {
  id: "advisor-chat",
  title: "AI Advisor Chat",
  route: "/chat?agent=technology",
  narration: NARRATION,
  estimatedDurationMs: 95_000,
  actions: [
    {
      timestamp: 4000,
      description: "Hover over conversation sidebar",
      action: async (page) => {
        // Hover over the sidebar area
        const sidebar = page.locator("nav").first();
        if (await sidebar.isVisible()) await sidebar.hover();
      },
    },
    {
      timestamp: 10000,
      description: "Click on an existing conversation in sidebar",
      action: async (page) => {
        const conv = page.locator('a[href*="/chat?agent="][href*="&id="]').first();
        if (await conv.isVisible()) await conv.click();
      },
    },
    {
      timestamp: 16000,
      description: "Wait for messages, then scroll through them",
      action: async (page) => {
        await page.waitForTimeout(1000);
        await smoothScroll(page, 300);
      },
    },
    {
      timestamp: 22000,
      description: "Continue scrolling through messages",
      action: async (page) => {
        await smoothScroll(page, 400);
      },
    },
    {
      timestamp: 28000,
      description: "Hover over an assistant response",
      action: async (page) => {
        const response = page.locator(".prose").first();
        if (await response.isVisible()) await response.hover();
      },
    },
    {
      timestamp: 36000,
      description: "Scroll down more to see more messages",
      action: async (page) => {
        await smoothScroll(page, 400);
      },
    },
    {
      timestamp: 44000,
      description: "Scroll back to top of messages",
      action: async (page) => {
        await page.evaluate(() =>
          window.scrollTo({ top: 0, behavior: "smooth" })
        );
      },
    },
    {
      timestamp: 52000,
      description: "Click New Conversation button",
      action: async (page) => {
        const newBtn = page.locator('button:has-text("New"), a:has-text("New")').first();
        if (await newBtn.isVisible()) await newBtn.click();
      },
    },
    {
      timestamp: 58000,
      description: "Hover over suggested prompts",
      action: async (page) => {
        const prompt = page.locator("button.rounded-lg.border.text-sm").first();
        if (await prompt.isVisible()) await prompt.hover();
      },
    },
    {
      timestamp: 64000,
      description: "Hover over second suggested prompt",
      action: async (page) => {
        const prompt = page.locator("button.rounded-lg.border.text-sm").nth(1);
        if (await prompt.isVisible()) await prompt.hover();
      },
    },
    {
      timestamp: 72000,
      description: "Hover over voice mode toggle",
      action: async (page) => {
        const voiceBtn = page.locator('button[aria-label*="voice"], button[aria-label*="Voice"]').first();
        if (await voiceBtn.isVisible()) await voiceBtn.hover();
      },
    },
    {
      timestamp: 78000,
      description: "Click back on existing conversation",
      action: async (page) => {
        const conv = page.locator('a[href*="/chat?agent="][href*="&id="]').first();
        if (await conv.isVisible()) await conv.click();
      },
    },
    {
      timestamp: 84000,
      description: "Slowly scroll through messages",
      action: async (page) => {
        await smoothScroll(page, 300);
      },
    },
  ],
};
