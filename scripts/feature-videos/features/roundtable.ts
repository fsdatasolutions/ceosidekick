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
            description: "Wait for page load",
            action: async (page) => {
                await page.waitForLoadState("networkidle");
            },
        },
        // Narration: "conversation history" — try to click an existing one, or just show the empty state
        {
            timestamp: 10000,
            description: "Try to click an existing conversation if any",
            action: async (page) => {
                const conv = page.locator("button.w-full.text-left.rounded-lg").first();
                if (await conv.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await conv.click();
                    await page.waitForTimeout(1500);
                }
            },
        },
        // Narration: "When you ask a question"
        {
            timestamp: 18000,
            description: "Scroll to see content or type a question",
            action: async (page) => {
                // If there's message content, scroll through it
                const messages = page.locator(".prose, [class*='rounded-2xl'][class*='p-']").first();
                if (await messages.isVisible({ timeout: 1000 }).catch(() => false)) {
                    await smoothScroll(page, 300);
                } else {
                    // Otherwise type a question in the input
                    const textarea = page.locator("textarea").first();
                    if (await textarea.isVisible()) {
                        await textarea.click();
                        await textarea.type("I'm considering expanding into the European market. What should I consider?", { delay: 30 });
                    }
                }
            },
        },
        // Narration: "synthesized summary"
        {
            timestamp: 26000,
            description: "Scroll to view synthesized summary area",
            action: async (page) => {
                await smoothScroll(page, 400);
            },
        },
        // Narration: "each advisor's individual perspective"
        {
            timestamp: 34000,
            description: "Scroll to individual advisor perspectives",
            action: async (page) => {
                await smoothScroll(page, 400);
            },
        },
        {
            timestamp: 40000,
            description: "Try to expand an advisor response section",
            action: async (page) => {
                const expandBtn = page.locator("button.w-full.text-left, [class*='cursor-pointer'][class*='rounded']").first();
                if (await expandBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
                    await expandBtn.click();
                }
            },
        },
        // Narration: "labeled with their name and avatar"
        {
            timestamp: 46000,
            description: "Hover over advisor name/avatar area",
            action: async (page) => {
                const avatar = page.locator("[class*='rounded-full'][class*='w-8'], [class*='rounded-full'][class*='w-10']").first();
                if (await avatar.isVisible({ timeout: 1000 }).catch(() => false)) {
                    await avatar.hover();
                }
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
            description: "Try to expand another advisor response",
            action: async (page) => {
                const expandBtn = page.locator("button.w-full.text-left, [class*='cursor-pointer'][class*='rounded']").nth(1);
                if (await expandBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
                    await expandBtn.click();
                }
            },
        },
        {
            timestamp: 64000,
            description: "Scroll through remaining content",
            action: async (page) => {
                await smoothScroll(page, 400);
            },
        },
        {
            timestamp: 72000,
            description: "Scroll to the input area at bottom",
            action: async (page) => {
                await page.evaluate(() =>
                    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
                );
            },
        },
        {
            timestamp: 80000,
            description: "Hover over suggested prompts if visible",
            action: async (page) => {
                const prompt = page.locator("button.rounded-lg.border.text-sm, button.rounded-full.border").first();
                if (await prompt.isVisible({ timeout: 1000 }).catch(() => false)) {
                    await prompt.hover();
                }
            },
        },
        {
            timestamp: 88000,
            description: "Scroll back to top",
            action: async (page) => {
                await page.evaluate(() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                );
            },
        },
    ],
};
