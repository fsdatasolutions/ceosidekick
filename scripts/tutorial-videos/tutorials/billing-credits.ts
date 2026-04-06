import type { FeatureConfig } from "../../feature-videos/lib/types";
import { smoothScroll } from "../../feature-videos/lib/recorder";

const NARRATION = `Understanding how credits work in CEO Sidekick helps you get the most out of your plan. Let's take a quick tour of the billing experience and how credit costs break down.

In Settings you will find your usage meter showing how many credits you have used out of your total allocation. Credits are the currency of the platform — every AI interaction consumes them. A standard advisor message costs one credit, generating a LinkedIn post costs one credit, and more intensive outputs like LinkedIn articles, web blog posts, and hero images cost three credits each. If you use voice mode with any advisor, that costs three times the normal rate, so plan accordingly.

CEO Sidekick offers three plans to fit different needs. The Free plan gives you fifteen credits to explore the platform. PowerUser at twenty-nine dollars per month comes with two hundred fifty credits, which is enough for most active users. And the Pro plan at one hundred ninety-nine dollars per month provides twenty-five hundred credits for power users and teams who rely on the platform daily.

To view your current plan details, scroll to the Billing and Plans section in Settings. You will see your plan name, credit balance, and usage for the current period. If you want to upgrade, there is a link in the sidebar to the pricing page where you can compare plans and switch in just a few clicks.

Keeping an eye on your credit usage helps you budget your AI interactions throughout the month. If you find yourself running low, consider whether upgrading to the next tier makes more sense than rationing credits. The goal is to use CEO Sidekick freely without worrying about hitting limits during critical work.`;

export const billingCredits: FeatureConfig = {
    id: "billing-credits",
    title: "Billing & Credits",
    route: "/settings",
    narration: NARRATION,
    estimatedDurationMs: 75_000,
    actions: [
        {
            timestamp: 5000,
            description: "Scroll to billing section in settings",
            action: async (page) => {
                await smoothScroll(page, 600);
            },
        },
        {
            timestamp: 12000,
            description: "Hover over usage meter showing credits used",
            action: async (page) => {
                const meter = page.locator('[data-testid="usage-meter"], .usage-meter, [role="progressbar"]').first();
                if (await meter.isVisible()) await meter.hover();
            },
        },
        {
            timestamp: 22000,
            description: "Scroll to show credit balance details",
            action: async (page) => {
                await smoothScroll(page, 300);
            },
        },
        {
            timestamp: 30000,
            description: "Hover over plan name and details",
            action: async (page) => {
                const plan = page.locator('[data-testid="plan-details"], .plan-name, h3:has-text("Plan"), p:has-text("credits")').first();
                if (await plan.isVisible()) await plan.hover();
            },
        },
        {
            timestamp: 40000,
            description: "Hover over sidebar pricing link",
            action: async (page) => {
                const link = page.locator('nav a[href*="pricing"], a:has-text("Pricing"), a:has-text("Upgrade")').first();
                if (await link.isVisible()) await link.hover();
            },
        },
        {
            timestamp: 50000,
            description: "Scroll to show full billing section",
            action: async (page) => {
                await smoothScroll(page, 300);
            },
        },
        {
            timestamp: 58000,
            description: "Hover over billing section details",
            action: async (page) => {
                const section = page.locator('[data-testid="billing-section"], section:has-text("Billing"), div:has-text("Billing")').first();
                if (await section.isVisible()) await section.hover();
            },
        },
        {
            timestamp: 68000,
            description: "Scroll back to top",
            action: async (page) => {
                await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
            },
        },
    ],
};
