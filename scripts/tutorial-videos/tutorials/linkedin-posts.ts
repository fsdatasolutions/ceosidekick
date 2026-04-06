import type { FeatureConfig } from "../../feature-videos/lib/types";
import { smoothScroll } from "../../feature-videos/lib/recorder";

const NARRATION = `Let's walk through creating a LinkedIn post from scratch using the Content Engine. This is one of the most frequently used features in CEO Sidekick.

From the LinkedIn Posts page you will see your existing posts and a button to create a new one. Click that and you will be taken to the AI generation form. Start by entering your topic or a brief idea — it can be as simple as a few words or a full paragraph describing what is on your mind. The more context you give the AI, the better the output.

Next, choose your post type. You can pick from thought leadership, storytelling, how-to guides, industry commentary, or personal updates. Each type follows a different structure that guides the AI when generating your draft. Then select your tone — professional, conversational, inspirational, or bold. You can also pick a Writer Profile if you have set up multiple voices for different contexts, ensuring the output matches the right person's style.

Once you hit generate, the AI produces a full draft in seconds. You will land in the editor which is a straightforward textarea where you can refine the text, adjust wording, add emojis or hashtags, and see a character count to make sure your post fits LinkedIn's limits. The editing experience is clean and simple — just you and your content with no distractions.

When you are happy with the post, you have three options: save it as a draft to come back to later, schedule it for a specific date and time to be published automatically, or publish it immediately to your connected LinkedIn account. Every post is tracked in your content library so you can revisit and repurpose your best content over time.`;

export const linkedinPosts: FeatureConfig = {
    id: "linkedin-posts",
    title: "Creating LinkedIn Posts",
    route: "/content-engine/linkedin-posts",
    narration: NARRATION,
    estimatedDurationMs: 80_000,
    actions: [
        {
            timestamp: 5000,
            description: "Scroll to reveal posts list",
            action: async (page) => {
                await smoothScroll(page, 250);
            },
        },
        {
            timestamp: 12000,
            description: "Click create new post button",
            action: async (page) => {
                const btn = page.locator('a[href*="new"], button:has-text("New Post"), button:has-text("Create")').first();
                if (await btn.isVisible()) await btn.click();
            },
        },
        {
            timestamp: 20000,
            description: "Hover over topic input field",
            action: async (page) => {
                const input = page.locator('textarea[name="topic"], input[name="topic"], [data-testid="topic-input"], [placeholder*="topic" i]').first();
                if (await input.isVisible()) await input.hover();
            },
        },
        {
            timestamp: 30000,
            description: "Hover over post type selector",
            action: async (page) => {
                const selector = page.locator('[data-testid="post-type"], label:has-text("Post Type"), select[name="postType"]').first();
                if (await selector.isVisible()) await selector.hover();
            },
        },
        {
            timestamp: 38000,
            description: "Hover over tone selector",
            action: async (page) => {
                const tone = page.locator('[data-testid="tone-select"], label:has-text("Tone"), select[name="tone"]').first();
                if (await tone.isVisible()) await tone.hover();
            },
        },
        {
            timestamp: 44000,
            description: "Hover over Writer Profile dropdown",
            action: async (page) => {
                const profile = page.locator('[data-testid="writer-profile"], select[name="writerProfile"], label:has-text("Writer Profile")').first();
                if (await profile.isVisible()) await profile.hover();
            },
        },
        {
            timestamp: 50000,
            description: "Hover over generate button",
            action: async (page) => {
                const btn = page.locator('button:has-text("Generate"), button:has-text("Create")').first();
                if (await btn.isVisible()) await btn.hover();
            },
        },
        {
            timestamp: 58000,
            description: "Scroll down to reveal the editor textarea",
            action: async (page) => {
                await smoothScroll(page, 350);
            },
        },
        {
            timestamp: 64000,
            description: "Hover over the post editor textarea and character count",
            action: async (page) => {
                const editor = page.locator('textarea[name="content"], textarea.editor, [data-testid="post-editor"], textarea').first();
                if (await editor.isVisible()) await editor.hover();
            },
        },
        {
            timestamp: 72000,
            description: "Hover over save/schedule/publish buttons",
            action: async (page) => {
                const btn = page.locator('button:has-text("Save"), button:has-text("Schedule"), button:has-text("Publish")').first();
                if (await btn.isVisible()) await btn.hover();
            },
        },
    ],
};
