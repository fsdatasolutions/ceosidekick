import type { FeatureConfig } from "../../feature-videos/lib/types";
import { smoothScroll } from "../../feature-videos/lib/recorder";

const NARRATION = `Let's take a look at how you can personalize CEO Sidekick to match your working style and business context. Getting these settings right makes every AI interaction dramatically more relevant and useful.

Start with Your Profile at the top of the settings page. Here you will enter your role, your years of experience, and your primary areas of focus. This tells every AI advisor who they are talking to so they can calibrate the depth and angle of their responses accordingly.

Next comes your Company Profile. Enter your company name, industry, company size, the products or services you offer, and your target market. This context is critical because it allows every advisor to tailor their guidance to your specific business situation rather than giving generic advice. Below that is the Business Context section where you describe your current goals, key challenges, and technology stack. The more detail you provide here, the better your results will be across the entire platform.

Scroll down to AI Preferences where you can fine-tune how the AI communicates with you. Adjust your preferred communication style and response length so the advisors match your expectations. Some users prefer concise bullet points while others want detailed explanations — this is where you set that.

The final sections are Content and Publishing, where you configure your blog directories and manage your LinkedIn connections, and Billing and Plans where you can view your current subscription. Completing all of these settings sections is one of the single biggest things you can do to improve the quality of AI responses across the entire platform.`;

export const settingsPersonalization: FeatureConfig = {
    id: "settings-personalization",
    title: "Settings & Personalization",
    route: "/settings",
    narration: NARRATION,
    estimatedDurationMs: 85_000,
    actions: [
        {
            timestamp: 5000,
            description: "Scroll to Your Profile section",
            action: async (page) => {
                await smoothScroll(page, 200);
            },
        },
        {
            timestamp: 12000,
            description: "Hover over role input field",
            action: async (page) => {
                const field = page.locator('input[name="role"], input[name="title"], [placeholder*="role" i]').first();
                if (await field.isVisible()) await field.hover();
            },
        },
        {
            timestamp: 18000,
            description: "Hover over experience input field",
            action: async (page) => {
                const field = page.locator('input[name="experience"], select[name="experience"]').first();
                if (await field.isVisible()) await field.hover();
            },
        },
        {
            timestamp: 24000,
            description: "Scroll to Company Profile section",
            action: async (page) => {
                await smoothScroll(page, 400);
            },
        },
        {
            timestamp: 30000,
            description: "Hover over company name field",
            action: async (page) => {
                const field = page.locator('input[name="companyName"], input[name="company_name"], [placeholder*="company" i]').first();
                if (await field.isVisible()) await field.hover();
            },
        },
        {
            timestamp: 36000,
            description: "Hover over industry selector",
            action: async (page) => {
                const field = page.locator('select[name="industry"], input[name="industry"], [placeholder*="industry" i]').first();
                if (await field.isVisible()) await field.hover();
            },
        },
        {
            timestamp: 42000,
            description: "Scroll to Business Context section",
            action: async (page) => {
                await smoothScroll(page, 400);
            },
        },
        {
            timestamp: 48000,
            description: "Hover over goals/challenges textarea",
            action: async (page) => {
                const field = page.locator('textarea[name="goals"], textarea[name="challenges"], [placeholder*="goals" i]').first();
                if (await field.isVisible()) await field.hover();
            },
        },
        {
            timestamp: 54000,
            description: "Scroll to AI Preferences section",
            action: async (page) => {
                await smoothScroll(page, 400);
            },
        },
        {
            timestamp: 60000,
            description: "Hover over communication style preference",
            action: async (page) => {
                const option = page.locator('label:has-text("Communication"), select[name="communicationStyle"], [data-testid="comm-style"]').first();
                if (await option.isVisible()) await option.hover();
            },
        },
        {
            timestamp: 66000,
            description: "Scroll to Content & Publishing and Billing sections",
            action: async (page) => {
                await smoothScroll(page, 400);
            },
        },
        {
            timestamp: 74000,
            description: "Hover over LinkedIn connections area",
            action: async (page) => {
                const area = page.locator('button:has-text("Connect"), [data-testid="linkedin-connect"], a:has-text("LinkedIn")').first();
                if (await area.isVisible()) await area.hover();
            },
        },
        {
            timestamp: 80000,
            description: "Scroll back to top",
            action: async (page) => {
                await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
            },
        },
    ],
};
