import type { FeatureConfig } from "../../feature-videos/lib/types";
import { smoothScroll } from "../../feature-videos/lib/recorder";

const NARRATION = `Scheduling and publishing posts from CEO Sidekick keeps your LinkedIn presence consistent without you needing to be online at the perfect posting time. Let's see how it all works.

From the LinkedIn Posts page you will see your content organized by status tabs: All, Drafts, Scheduled, Failed, Published, and Archived. These tabs let you quickly filter your posts and see exactly where each piece of content stands in your publishing pipeline. Click any tab to filter the list and focus on the posts that need your attention.

To schedule a post, open any draft by clicking on it to go to the post detail page. There you will find the scheduling controls. Pick a date and time using the date and time picker, choose whether to post as your personal profile or your organization page, and set the visibility level. The platform suggests optimal posting times based on proven engagement windows to help you maximize reach.

Once you confirm the schedule, the post moves to your Scheduled tab. This tab shows a list view of all your queued posts with their scheduled dates, times, and which LinkedIn page they will be published to. If plans change, you can cancel any scheduled post to revert it back to a draft. There is no calendar drag-and-drop — it is a clean, simple list that keeps things straightforward.

When the scheduled time arrives, a background cron job automatically publishes your post to LinkedIn. You do not need to be logged in or have the app open. Posts that publish successfully move to the Published tab, and any that encounter issues appear in the Failed tab so you can retry them. This automated pipeline means you can batch your content creation and let the platform handle the rest.`;

export const schedulingPublishing: FeatureConfig = {
    id: "scheduling-publishing",
    title: "Scheduling & Publishing",
    route: "/content-engine/linkedin-posts",
    narration: NARRATION,
    estimatedDurationMs: 85_000,
    actions: [
        {
            timestamp: 5000,
            description: "Scroll to reveal posts list with status tabs",
            action: async (page) => {
                await smoothScroll(page, 200);
            },
        },
        {
            timestamp: 10000,
            description: "Hover over All status tab",
            action: async (page) => {
                const tab = page.locator('a:has-text("All"), button:has-text("All")').first();
                if (await tab.isVisible()) await tab.hover();
            },
        },
        {
            timestamp: 14000,
            description: "Hover over Drafts status tab",
            action: async (page) => {
                const tab = page.locator('a:has-text("Drafts"), button:has-text("Drafts")').first();
                if (await tab.isVisible()) await tab.hover();
            },
        },
        {
            timestamp: 18000,
            description: "Click Scheduled status tab",
            action: async (page) => {
                const tab = page.locator('a:has-text("Scheduled"), button:has-text("Scheduled")').first();
                if (await tab.isVisible()) await tab.click();
            },
        },
        {
            timestamp: 22000,
            description: "Hover over Published status tab",
            action: async (page) => {
                const tab = page.locator('a:has-text("Published"), button:has-text("Published")').first();
                if (await tab.isVisible()) await tab.hover();
            },
        },
        {
            timestamp: 26000,
            description: "Click Drafts tab to show draft posts",
            action: async (page) => {
                const tab = page.locator('a:has-text("Drafts"), button:has-text("Drafts")').first();
                if (await tab.isVisible()) await tab.click();
            },
        },
        {
            timestamp: 32000,
            description: "Scroll to show draft posts in list",
            action: async (page) => {
                await smoothScroll(page, 300);
            },
        },
        {
            timestamp: 38000,
            description: "Hover over first post in the list",
            action: async (page) => {
                const post = page.locator('[data-testid="post-card"], .post-card, article, tr').first();
                if (await post.isVisible()) await post.hover();
            },
        },
        {
            timestamp: 48000,
            description: "Scroll down to show more posts",
            action: async (page) => {
                await smoothScroll(page, 300);
            },
        },
        {
            timestamp: 56000,
            description: "Click Scheduled tab to show queued posts",
            action: async (page) => {
                const tab = page.locator('a:has-text("Scheduled"), button:has-text("Scheduled")').first();
                if (await tab.isVisible()) await tab.click();
            },
        },
        {
            timestamp: 62000,
            description: "Scroll to reveal scheduled posts list",
            action: async (page) => {
                await smoothScroll(page, 300);
            },
        },
        {
            timestamp: 70000,
            description: "Hover over a scheduled post item",
            action: async (page) => {
                const post = page.locator('[data-testid="post-card"], .post-card, article, tr').first();
                if (await post.isVisible()) await post.hover();
            },
        },
        {
            timestamp: 78000,
            description: "Scroll back to top",
            action: async (page) => {
                await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
            },
        },
    ],
};
