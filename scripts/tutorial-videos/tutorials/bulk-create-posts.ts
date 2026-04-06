import type { FeatureConfig } from "../../feature-videos/lib/types";
import { smoothScroll } from "../../feature-videos/lib/recorder";

const NARRATION = `If you want to build out a full week or month of LinkedIn content in one sitting, bulk post creation is the way to go. Let's walk through how it works.

On the bulk creation page you will start by selecting how many posts you want to generate. Use the slider to pick anywhere from one to twenty posts. Below that you will choose a theme — this keeps all your generated posts cohesive. You might pick something like leadership insights, product updates, or industry trends. The theme guides the AI so every post in the batch feels connected.

Next, select the Writer Profile. If you manage content for multiple team members, you can choose whose voice and style the AI should use for this batch. Each writer profile pulls in that person's preferences, writing style, and tone settings automatically so the output feels authentic to them. This is powered by the WriterProfileSelector component which shows all configured profiles.

Once you hit generate, the AI goes to work creating all your posts at once. Behind the scenes, Tavily web research runs for each post, pulling in current data and trends to make your content research-driven and timely. You will see a progress indicator and then a scrollable list of drafts. Each post can be individually edited, reordered, or removed. Click into any post to open the full editor and make refinements.

The final step is reviewing and saving your batch. Each post is saved as a draft that you can then schedule individually from the LinkedIn Posts page. The platform suggests optimal posting times to help you space out your content. When everything looks good, confirm the batch and all posts are queued up as drafts ready for scheduling. You have just planned weeks of content in minutes.`;

export const bulkCreatePosts: FeatureConfig = {
    id: "bulk-create-posts",
    title: "Bulk Create Posts",
    route: "/content-engine/linkedin-posts/bulk",
    narration: NARRATION,
    estimatedDurationMs: 85_000,
    actions: [
        {
            timestamp: 5000,
            description: "Scroll to reveal bulk creation form",
            action: async (page) => {
                await smoothScroll(page, 250);
            },
        },
        {
            timestamp: 14000,
            description: "Hover over post count slider (1-20 range)",
            action: async (page) => {
                const slider = page.locator('input[type="range"], [data-testid="post-count-slider"]').first();
                if (await slider.isVisible()) await slider.hover();
            },
        },
        {
            timestamp: 22000,
            description: "Hover over theme selector",
            action: async (page) => {
                const theme = page.locator('[data-testid="theme-select"], select[name="theme"], label:has-text("Theme"), input[name="theme"]').first();
                if (await theme.isVisible()) await theme.hover();
            },
        },
        {
            timestamp: 30000,
            description: "Scroll to Writer Profile section",
            action: async (page) => {
                await smoothScroll(page, 300);
            },
        },
        {
            timestamp: 36000,
            description: "Hover over Writer Profile selector",
            action: async (page) => {
                const writer = page.locator('[data-testid="writer-profile-selector"], select[name="writerProfile"], label:has-text("Writer Profile")').first();
                if (await writer.isVisible()) await writer.hover();
            },
        },
        {
            timestamp: 44000,
            description: "Hover over generate button",
            action: async (page) => {
                const btn = page.locator('button:has-text("Generate"), button:has-text("Create")').first();
                if (await btn.isVisible()) await btn.hover();
            },
        },
        {
            timestamp: 52000,
            description: "Scroll to reveal generated posts list",
            action: async (page) => {
                await smoothScroll(page, 400);
            },
        },
        {
            timestamp: 60000,
            description: "Hover over first generated post card",
            action: async (page) => {
                const card = page.locator('[data-testid="post-card"], .post-card, article').first();
                if (await card.isVisible()) await card.hover();
            },
        },
        {
            timestamp: 68000,
            description: "Scroll to review and confirm section",
            action: async (page) => {
                await smoothScroll(page, 400);
            },
        },
        {
            timestamp: 76000,
            description: "Hover over confirm batch button",
            action: async (page) => {
                const btn = page.locator('button:has-text("Save"), button:has-text("Confirm"), button:has-text("Create Posts")').first();
                if (await btn.isVisible()) await btn.hover();
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
