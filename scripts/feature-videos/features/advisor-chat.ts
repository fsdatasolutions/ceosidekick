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
        // Narration: "conversation sidebar showing your chat history"
        {
            timestamp: 4000,
            description: "Open chat history sidebar",
            action: async (page) => {
                const historyBtn = page.locator('button[title="Chat History"]').first();
                if (await historyBtn.isVisible()) await historyBtn.click();
                await page.waitForTimeout(500);
            },
        },
        {
            timestamp: 10000,
            description: "Close history sidebar",
            action: async (page) => {
                // Close button inside the history panel
                const closeBtn = page.locator('button:has(svg.lucide-chevron-left)').first();
                if (await closeBtn.isVisible()) await closeBtn.click();
                await page.waitForTimeout(500);
            },
        },
        // Narration: "choose which advisor to speak with"
        {
            timestamp: 16000,
            description: "Open agent selector dropdown",
            action: async (page) => {
                // Click the agent name/avatar area which toggles the dropdown
                const agentSelector = page.locator('button:has(.lucide-chevron-down)').first();
                if (await agentSelector.isVisible()) await agentSelector.click();
                await page.waitForTimeout(500);
            },
        },
        // Narration: "Technology Partner acts as your virtual CTO"
        {
            timestamp: 22000,
            description: "Hover over Technology Partner in dropdown",
            action: async (page) => {
                const techOption = page.locator('button:has-text("Technology Partner")').first();
                if (await techOption.isVisible()) await techOption.hover();
            },
        },
        // Narration: "Executive Coach supports your leadership"
        {
            timestamp: 28000,
            description: "Hover over Executive Coach in dropdown",
            action: async (page) => {
                const coachOption = page.locator('button:has-text("Executive Coach")').first();
                if (await coachOption.isVisible()) await coachOption.hover();
            },
        },
        // Narration: "Legal Advisor helps with contracts"
        {
            timestamp: 33000,
            description: "Hover over Legal Advisor in dropdown",
            action: async (page) => {
                const legalOption = page.locator('button:has-text("Legal Advisor")').first();
                if (await legalOption.isVisible()) await legalOption.hover();
            },
        },
        // Narration: "HR, Marketing, and Sales partners"
        {
            timestamp: 37000,
            description: "Scroll down in agent dropdown to show more advisors",
            action: async (page) => {
                const marketingOption = page.locator('button:has-text("Marketing Partner")').first();
                if (await marketingOption.isVisible()) await marketingOption.hover();
            },
        },
        {
            timestamp: 41000,
            description: "Select Marketing Partner to switch advisor",
            action: async (page) => {
                const marketingOption = page.locator('button:has-text("Marketing Partner")').first();
                if (await marketingOption.isVisible()) await marketingOption.click();
                await page.waitForLoadState("networkidle");
                await page.waitForTimeout(1000);
            },
        },
        // Narration: "suggested prompts that appear when you start a new chat"
        {
            timestamp: 52000,
            description: "Hover over first suggested prompt",
            action: async (page) => {
                // Suggested prompt buttons in the empty chat state
                const prompt = page.locator("button.rounded-lg.border").first();
                if (await prompt.isVisible()) await prompt.hover();
            },
        },
        {
            timestamp: 57000,
            description: "Hover over second suggested prompt",
            action: async (page) => {
                const prompt = page.locator("button.rounded-lg.border").nth(1);
                if (await prompt.isVisible()) await prompt.hover();
            },
        },
        // Narration: "type a message to get started"
        {
            timestamp: 62000,
            description: "Click into the message input textarea",
            action: async (page) => {
                const textarea = page.locator("textarea").first();
                if (await textarea.isVisible()) {
                    await textarea.click();
                    await page.waitForTimeout(500);
                    await textarea.type("What marketing channels should I focus on with a $5K monthly budget?", { delay: 40 });
                }
            },
        },
        // Narration: "voice mode for hands-free interaction"
        {
            timestamp: 74000,
            description: "Clear textarea and hover over voice mode button",
            action: async (page) => {
                const textarea = page.locator("textarea").first();
                if (await textarea.isVisible()) {
                    await textarea.fill("");
                }
                // Look for voice/mic button
                const voiceBtn = page.locator("button:has(.lucide-mic), button:has(.lucide-radio)").first();
                if (await voiceBtn.isVisible()) await voiceBtn.hover();
            },
        },
        // Narration: "Every conversation is saved and searchable"
        {
            timestamp: 80000,
            description: "Open history sidebar again to show saved conversations",
            action: async (page) => {
                const historyBtn = page.locator('button[title="Chat History"]').first();
                if (await historyBtn.isVisible()) await historyBtn.click();
                await page.waitForTimeout(500);
            },
        },
        {
            timestamp: 88000,
            description: "Close history sidebar",
            action: async (page) => {
                const closeBtn = page.locator('button:has(svg.lucide-chevron-left)').first();
                if (await closeBtn.isVisible()) await closeBtn.click();
            },
        },
    ],
};
