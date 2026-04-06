import type { FeatureConfig } from "../../feature-videos/lib/types";
import { smoothScroll } from "../../feature-videos/lib/recorder";

const NARRATION = `Content campaigns let you generate a complete set of multi-format content from a single brief. This is perfect when you have a product launch, thought leadership topic, or big announcement to promote across channels.

The campaign creation wizard starts with your brief. In step one you will enter the topic for your campaign, define your target audience, list the key points you want to cover, and select your preferred tone. You can also choose an author from your writer profiles so the generated content matches a specific voice and style. Be as detailed as possible here because the AI uses every detail to craft more targeted content.

In step two you select which output formats you want the AI to generate. The available options are Hero Image, LinkedIn Article, LinkedIn Post, and Web Blog. Check the boxes for each output you need and the platform will generate all of them from your single brief. You can select any combination depending on your campaign goals.

Once you have configured your brief and selected your outputs, hit the generate button. You will see a progress indicator as the AI creates each piece of content. This may take a moment depending on how many outputs you selected, especially if you included a hero image.

When generation is complete you land on the review screen where all your generated content is organized by type. Each piece can be previewed and edited individually. You can refine the LinkedIn post, adjust the blog article, or regenerate any single output without starting over. From here you can save items to your content library, schedule posts, or continue editing until everything is exactly right.`;

export const contentCampaigns: FeatureConfig = {
    id: "content-campaigns",
    title: "Content Campaigns",
    route: "/content-engine/create",
    narration: NARRATION,
    estimatedDurationMs: 85_000,
    actions: [
        {
            timestamp: 5000,
            description: "Scroll to reveal the campaign brief form",
            action: async (page) => {
                await smoothScroll(page, 250);
            },
        },
        {
            timestamp: 12000,
            description: "Hover over topic input field",
            action: async (page) => {
                const input = page.locator('input[name="topic"], textarea[name="topic"], [placeholder*="topic" i]').first();
                if (await input.isVisible()) await input.hover();
            },
        },
        {
            timestamp: 18000,
            description: "Hover over target audience input",
            action: async (page) => {
                const input = page.locator('input[name="audience"], textarea[name="audience"], [placeholder*="audience" i]').first();
                if (await input.isVisible()) await input.hover();
            },
        },
        {
            timestamp: 24000,
            description: "Hover over key points input",
            action: async (page) => {
                const input = page.locator('textarea[name="keyPoints"], [placeholder*="key points" i], textarea[name="key_points"]').first();
                if (await input.isVisible()) await input.hover();
            },
        },
        {
            timestamp: 30000,
            description: "Scroll to output selection area",
            action: async (page) => {
                await smoothScroll(page, 400);
            },
        },
        {
            timestamp: 36000,
            description: "Hover over Hero Image output checkbox",
            action: async (page) => {
                const checkbox = page.locator('label:has-text("Hero Image"), input[value*="hero" i]').first();
                if (await checkbox.isVisible()) await checkbox.hover();
            },
        },
        {
            timestamp: 40000,
            description: "Hover over LinkedIn Article output checkbox",
            action: async (page) => {
                const checkbox = page.locator('label:has-text("LinkedIn Article"), input[value*="linkedin-article" i]').first();
                if (await checkbox.isVisible()) await checkbox.hover();
            },
        },
        {
            timestamp: 44000,
            description: "Hover over LinkedIn Post output checkbox",
            action: async (page) => {
                const checkbox = page.locator('label:has-text("LinkedIn Post"), input[value*="linkedin-post" i]').first();
                if (await checkbox.isVisible()) await checkbox.hover();
            },
        },
        {
            timestamp: 48000,
            description: "Hover over Web Blog output checkbox",
            action: async (page) => {
                const checkbox = page.locator('label:has-text("Web Blog"), input[value*="blog" i]').first();
                if (await checkbox.isVisible()) await checkbox.hover();
            },
        },
        {
            timestamp: 54000,
            description: "Hover over generate campaign button",
            action: async (page) => {
                const btn = page.locator('button:has-text("Generate"), button:has-text("Create")').first();
                if (await btn.isVisible()) await btn.hover();
            },
        },
        {
            timestamp: 62000,
            description: "Scroll to review area with generated outputs",
            action: async (page) => {
                await smoothScroll(page, 500);
            },
        },
        {
            timestamp: 70000,
            description: "Hover over first generated content card",
            action: async (page) => {
                const card = page.locator('[data-testid="campaign-output"], article, .content-card').first();
                if (await card.isVisible()) await card.hover();
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
