import type { FeatureConfig } from "../lib/types";
import { smoothScroll } from "../lib/recorder";

const NARRATION = `The Round Table is CEO Sidekick's most powerful feature. Instead of consulting one advisor at a time, you can get perspectives from multiple advisors in a single conversation.

On the left, you have your conversation history just like in regular chat. But the Round Table experience is fundamentally different. When you ask a question, CEO Sidekick automatically identifies which advisors are most relevant and consults them simultaneously.

Look at how a response is structured. First, you see a synthesized summary that weaves together the best insights from all advisors. Then you can see each advisor's individual perspective. The Technology Partner might focus on technical implications, while the Legal Advisor highlights compliance considerations, and the Marketing Partner offers go-to-market insights.

Each advisor's response is clearly labeled with their name and avatar, and you can see their relevance score for the topic. This multi-perspective approach catches blind spots that a single advisor might miss.

The Round Table is ideal for complex decisions like entering a new market, restructuring your team, or evaluating an acquisition. You get the equivalent of a board meeting with domain experts, available anytime you need it.`;

export const roundtable: FeatureConfig = {
  id: "roundtable",
  title: "Round Table",
  route: "/roundtable",
  narration: NARRATION,
  estimatedDurationMs: 96_000,
  actions: [
    {
      timestamp: 4000,
      description: "Wait for page load, view sidebar",
      action: async (page) => {
        await page.waitForLoadState("networkidle");
      },
    },
    {
      timestamp: 10000,
      description: "Click on an existing conversation",
      action: async (page) => {
        const conv = page.locator("button.w-full.rounded-lg, a[href*='roundtable']").first();
        if (await conv.isVisible()) await conv.click();
        await page.waitForTimeout(1500);
      },
    },
    {
      timestamp: 18000,
      description: "Wait for messages, scroll to response",
      action: async (page) => {
        await smoothScroll(page, 300);
      },
    },
    {
      timestamp: 26000,
      description: "View synthesized summary card",
      action: async (page) => {
        const summary = page.locator('[class*="amber-50"], [class*="gradient"]').first();
        if (await summary.isVisible()) await summary.hover();
      },
    },
    {
      timestamp: 34000,
      description: "Scroll down to individual advisor perspectives",
      action: async (page) => {
        await smoothScroll(page, 400);
      },
    },
    {
      timestamp: 40000,
      description: "Click to expand first advisor response",
      action: async (page) => {
        const advisor = page.locator("button.w-full.text-left").nth(0);
        if (await advisor.isVisible()) await advisor.click();
      },
    },
    {
      timestamp: 46000,
      description: "Hover over advisor name and avatar",
      action: async (page) => {
        const name = page.locator(".font-medium.text-sm").first();
        if (await name.isVisible()) await name.hover();
      },
    },
    {
      timestamp: 52000,
      description: "Scroll to see more advisor responses",
      action: async (page) => {
        await smoothScroll(page, 400);
      },
    },
    {
      timestamp: 58000,
      description: "Click to expand another advisor response",
      action: async (page) => {
        const advisor = page.locator("button.w-full.text-left").nth(1);
        if (await advisor.isVisible()) await advisor.click();
      },
    },
    {
      timestamp: 64000,
      description: "Hover over relevance score",
      action: async (page) => {
        const score = page.locator("text=relevant, text=Relevant").first();
        if (await score.isVisible()) await score.hover();
      },
    },
    {
      timestamp: 70000,
      description: "Scroll to view all advisor responses",
      action: async (page) => {
        await smoothScroll(page, 400);
      },
    },
    {
      timestamp: 78000,
      description: "Scroll to input area",
      action: async (page) => {
        await smoothScroll(page, 300);
      },
    },
    {
      timestamp: 84000,
      description: "Hover over suggested prompts",
      action: async (page) => {
        const prompt = page.locator("button.rounded-lg.border.text-sm").first();
        if (await prompt.isVisible()) await prompt.hover();
      },
    },
  ],
};
