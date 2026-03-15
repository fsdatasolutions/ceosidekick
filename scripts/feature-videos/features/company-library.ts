import type { FeatureConfig } from "../lib/types";
import { smoothScroll } from "../lib/recorder";

const NARRATION = `The Company Library is your centralized knowledge base. Upload your business documents here, and your AI advisors will use them as context when giving you advice.

At the top, you can see storage stats showing how many documents you've uploaded, how much storage you're using, and how many text chunks have been indexed. The chunking process makes your documents searchable and accessible to the AI.

The search bar lets you quickly find any document by name. Below that, there's a drag-and-drop zone for uploading new files. CEO Sidekick supports PDF, Word, plain text, and markdown files up to ten megabytes each.

In the document table, you can see each file's name, processing status, size, and upload date. Documents go through an indexing pipeline — first uploaded, then processed into searchable chunks, and finally marked as ready. You can see the green Ready badges showing which documents are fully indexed.

The power of the Company Library is that once your documents are here, every AI advisor automatically has access to your business context. The advice you get is grounded in your actual data, not generic recommendations.`;

export const companyLibrary: FeatureConfig = {
  id: "company-library",
  title: "Company Library",
  route: "/knowledge-base",
  narration: NARRATION,
  estimatedDurationMs: 90_000,
  actions: [
    {
      timestamp: 4000,
      description: "Scroll to reveal stats row",
      action: async (page) => {
        await smoothScroll(page, 150);
      },
    },
    {
      timestamp: 10000,
      description: "Hover over documents count stat",
      action: async (page) => {
        const stat = page.locator("text=Documents").first();
        if (await stat.isVisible()) await stat.hover();
      },
    },
    {
      timestamp: 14000,
      description: "Hover over storage stat",
      action: async (page) => {
        const stat = page.locator("text=Storage").first();
        if (await stat.isVisible()) await stat.hover();
      },
    },
    {
      timestamp: 18000,
      description: "Hover over chunks stat",
      action: async (page) => {
        const stat = page.locator("text=Chunks").first();
        if (await stat.isVisible()) await stat.hover();
      },
    },
    {
      timestamp: 22000,
      description: "Click into search bar and type",
      action: async (page) => {
        const search = page.locator('input[placeholder*="Search"]').first();
        if (await search.isVisible()) {
          await search.click();
          await page.keyboard.type("business", { delay: 80 });
        }
      },
    },
    {
      timestamp: 30000,
      description: "Clear search bar",
      action: async (page) => {
        const search = page.locator('input[placeholder*="Search"]').first();
        if (await search.isVisible()) {
          await search.fill("");
        }
      },
    },
    {
      timestamp: 33000,
      description: "Scroll down to dropzone",
      action: async (page) => {
        await smoothScroll(page, 300);
      },
    },
    {
      timestamp: 38000,
      description: "Hover over upload dropzone",
      action: async (page) => {
        const dropzone = page.locator(".border-dashed").first();
        if (await dropzone.isVisible()) await dropzone.hover();
      },
    },
    {
      timestamp: 44000,
      description: "Scroll to document table",
      action: async (page) => {
        await smoothScroll(page, 400);
      },
    },
    {
      timestamp: 50000,
      description: "Hover over a document row",
      action: async (page) => {
        const row = page.locator("tr.hover\\:bg-neutral-50, tr").nth(1);
        if (await row.isVisible()) await row.hover();
      },
    },
    {
      timestamp: 56000,
      description: "Hover over a Ready status badge",
      action: async (page) => {
        const badge = page.locator("text=Ready").first();
        if (await badge.isVisible()) await badge.hover();
      },
    },
    {
      timestamp: 62000,
      description: "Continue scrolling through documents",
      action: async (page) => {
        await smoothScroll(page, 300);
      },
    },
    {
      timestamp: 70000,
      description: "Scroll back to top",
      action: async (page) => {
        await page.evaluate(() =>
          window.scrollTo({ top: 0, behavior: "smooth" })
        );
      },
    },
    {
      timestamp: 76000,
      description: "Hover over Ask Questions button",
      action: async (page) => {
        const btn = page.locator('a[href*="/chat?agent=knowledge"], button:has-text("Ask Questions")').first();
        if (await btn.isVisible()) await btn.hover();
      },
    },
  ],
};
