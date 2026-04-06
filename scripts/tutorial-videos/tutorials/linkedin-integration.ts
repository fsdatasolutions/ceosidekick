import type { FeatureConfig } from "../../feature-videos/lib/types";
import { smoothScroll } from "../../feature-videos/lib/recorder";

const NARRATION = `Connecting your LinkedIn account to CEO Sidekick unlocks direct publishing and scheduling so you can go from content creation to live posts without leaving the platform. Let's walk through the integration setup.

Head over to Settings and scroll down to the LinkedIn integration section. You will see two connection options: your personal LinkedIn profile and any LinkedIn organization pages you manage. Starting with your personal account, click the connect button and you will be guided through LinkedIn's standard OAuth flow. Authorize CEO Sidekick to post on your behalf, and you are connected in seconds.

If you manage company pages on LinkedIn, you can connect those too. Click the connect button next to organization pages and select which pages you would like to link. This is especially useful if you create content for your company's official page in addition to your personal brand. Each connected page appears as a publishing destination when you schedule posts, giving you the flexibility to publish to any account from one place.

Once connected, you will see a summary of all your linked accounts with status indicators showing whether each connection is active and healthy. If a token expires or needs re-authentication, the platform will notify you and provide a one-click reconnect option right here on the settings page.

Managing your connections is straightforward. You can disconnect any account at any time if you no longer want CEO Sidekick to publish to that profile, refresh tokens when needed, or add new organization pages as your company grows. The integration is focused on publishing and scheduling — it gives CEO Sidekick the ability to post content on your behalf so you can automate your entire content pipeline.`;

export const linkedinIntegration: FeatureConfig = {
    id: "linkedin-integration",
    title: "LinkedIn Integration",
    route: "/settings",
    narration: NARRATION,
    estimatedDurationMs: 75_000,
    actions: [
        {
            timestamp: 5000,
            description: "Scroll to LinkedIn integration section",
            action: async (page) => {
                await smoothScroll(page, 500);
            },
        },
        {
            timestamp: 12000,
            description: "Hover over personal LinkedIn connect button",
            action: async (page) => {
                const btn = page.locator('button:has-text("Connect"), [data-testid="linkedin-connect"]').first();
                if (await btn.isVisible()) await btn.hover();
            },
        },
        {
            timestamp: 22000,
            description: "Scroll to organization pages section",
            action: async (page) => {
                await smoothScroll(page, 300);
            },
        },
        {
            timestamp: 30000,
            description: "Hover over org page connect button",
            action: async (page) => {
                const btn = page.locator('[data-testid="org-connect"], button:has-text("Connect Page"), button:has-text("Add Page")').first();
                if (await btn.isVisible()) await btn.hover();
            },
        },
        {
            timestamp: 40000,
            description: "Scroll to connection status summary",
            action: async (page) => {
                await smoothScroll(page, 300);
            },
        },
        {
            timestamp: 48000,
            description: "Hover over connection status indicator",
            action: async (page) => {
                const status = page.locator('[data-testid="connection-status"], .connection-status, span:has-text("Active"), span:has-text("Connected")').first();
                if (await status.isVisible()) await status.hover();
            },
        },
        {
            timestamp: 56000,
            description: "Hover over disconnect button",
            action: async (page) => {
                const btn = page.locator('button:has-text("Disconnect"), [data-testid="disconnect-btn"]').first();
                if (await btn.isVisible()) await btn.hover();
            },
        },
        {
            timestamp: 64000,
            description: "Hover over refresh/reconnect button",
            action: async (page) => {
                const btn = page.locator('button:has-text("Refresh"), button:has-text("Reconnect")').first();
                if (await btn.isVisible()) await btn.hover();
            },
        },
        {
            timestamp: 70000,
            description: "Scroll back to top",
            action: async (page) => {
                await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
            },
        },
    ],
};
