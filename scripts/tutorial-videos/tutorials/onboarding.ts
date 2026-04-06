import type { FeatureConfig } from "../../feature-videos/lib/types";
import { smoothScroll } from "../../feature-videos/lib/recorder";

const NARRATION = `Welcome to CEO Sidekick. This is your dashboard — the command center for everything you do on the platform. From here you have instant access to all the tools and AI advisors that help you run your business more effectively.

At the top of the dashboard you will see the tools grid. These are the core features of the platform: Chat for real-time AI advisor conversations, Templates for reusable prompt frameworks, Company Library for storing and referencing your business documents, Content Engine for generating LinkedIn posts and campaigns, Goals for tracking your strategic objectives, and Round Table for multi-advisor brainstorming sessions. Each card takes you directly into that feature with one click.

On the left sidebar you will find persistent navigation to every area of the platform. This is how you move between Chat, Company Library, Content Engine, Goals, Settings, and more. The sidebar stays accessible from every page so you always know where you are and where to go next.

Below the tools grid you will find your AI advisor team. These are specialized advisors covering areas like marketing, strategy, operations, finance, and leadership. Each card shows the advisor name and what they specialize in. Clicking any advisor card opens a direct conversation where the AI draws on your company context and preferences to give tailored advice.

Further down the dashboard you can see your credit usage display showing how many credits you have used out of your total allocation, along with your recent conversations so you can quickly pick up where you left off. The dashboard gives you a complete picture of your activity and resources at a glance.`;

export const onboarding: FeatureConfig = {
    id: "onboarding",
    title: "Platform Overview & Dashboard Tour",
    route: "/dashboard",
    narration: NARRATION,
    estimatedDurationMs: 90_000,
    actions: [
        {
            timestamp: 5000,
            description: "Scroll to reveal the tools grid",
            action: async (page) => {
                await smoothScroll(page, 300);
            },
        },
        {
            timestamp: 14000,
            description: "Hover over Chat tool card",
            action: async (page) => {
                const card = page.locator('a[href="/chat"]').first();
                if (await card.isVisible()) await card.hover();
            },
        },
        {
            timestamp: 18000,
            description: "Hover over Content Engine tool card",
            action: async (page) => {
                const card = page.locator('a[href="/content-engine"]').first();
                if (await card.isVisible()) await card.hover();
            },
        },
        {
            timestamp: 24000,
            description: "Scroll back to top to show sidebar",
            action: async (page) => {
                await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
            },
        },
        {
            timestamp: 30000,
            description: "Hover over sidebar Chat nav link",
            action: async (page) => {
                const link = page.locator('nav a[href="/chat"]').first();
                if (await link.isVisible()) await link.hover();
            },
        },
        {
            timestamp: 35000,
            description: "Hover over sidebar Company Library nav link",
            action: async (page) => {
                const link = page.locator('nav a[href="/company-library"]').first();
                if (await link.isVisible()) await link.hover();
            },
        },
        {
            timestamp: 40000,
            description: "Hover over sidebar Content Engine nav link",
            action: async (page) => {
                const link = page.locator('nav a[href="/content-engine"]').first();
                if (await link.isVisible()) await link.hover();
            },
        },
        {
            timestamp: 45000,
            description: "Hover over sidebar Goals nav link",
            action: async (page) => {
                const link = page.locator('nav a[href="/goals"]').first();
                if (await link.isVisible()) await link.hover();
            },
        },
        {
            timestamp: 50000,
            description: "Hover over sidebar Settings nav link",
            action: async (page) => {
                const link = page.locator('nav a[href="/settings"]').first();
                if (await link.isVisible()) await link.hover();
            },
        },
        {
            timestamp: 56000,
            description: "Scroll down to AI advisor team cards",
            action: async (page) => {
                await smoothScroll(page, 500);
            },
        },
        {
            timestamp: 64000,
            description: "Hover over first AI advisor card",
            action: async (page) => {
                const card = page.locator('a[href*="/chat?agent="]').first();
                if (await card.isVisible()) await card.hover();
            },
        },
        {
            timestamp: 72000,
            description: "Scroll down to credit usage and recent conversations",
            action: async (page) => {
                await smoothScroll(page, 400);
            },
        },
        {
            timestamp: 82000,
            description: "Scroll back to top",
            action: async (page) => {
                await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
            },
        },
    ],
};
