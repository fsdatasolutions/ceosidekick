import type { FeatureConfig } from "../lib/types";
import { smoothScroll } from "../lib/recorder";

const NARRATION = `Document Templates let you generate professional business documents in seconds, pre-filled with your company information.

At the top, you can filter templates by category — Business, Finance, HR, or Marketing. CEO Sidekick offers templates including business plans, pitch decks, project proposals, meeting notes, invoices, expense reports, employee handbooks, job descriptions, marketing plans, and brand guidelines.

Each template card shows the document name, a description, and the output format. You'll see formats like Word documents, PowerPoint presentations, Excel spreadsheets, and PDFs — each color-coded for easy scanning.

When you click on a template, a preview modal opens showing what the generated document will look like before you commit. The document is automatically filled with your company details from your settings, so it's ready to review immediately.

Once generated, you can download the document or save it directly to your Company Library for future reference. This feature alone can save you days of work on routine business documents.`;

export const documents: FeatureConfig = {
  id: "documents",
  title: "Document Templates",
  route: "/documents",
  narration: NARRATION,
  estimatedDurationMs: 87_000,
  actions: [
    {
      timestamp: 4000,
      description: "View page, scroll slightly",
      action: async (page) => {
        await smoothScroll(page, 150);
      },
    },
    {
      timestamp: 8000,
      description: "Click Business category filter",
      action: async (page) => {
        const btn = page.locator('button:has-text("Business")').first();
        if (await btn.isVisible()) await btn.click();
      },
    },
    {
      timestamp: 12000,
      description: "Click Finance category filter",
      action: async (page) => {
        const btn = page.locator('button:has-text("Finance")').first();
        if (await btn.isVisible()) await btn.click();
      },
    },
    {
      timestamp: 16000,
      description: "Click HR category filter",
      action: async (page) => {
        const btn = page.locator('button:has-text("HR")').first();
        if (await btn.isVisible()) await btn.click();
      },
    },
    {
      timestamp: 20000,
      description: "Click Marketing category filter",
      action: async (page) => {
        const btn = page.locator('button:has-text("Marketing")').first();
        if (await btn.isVisible()) await btn.click();
      },
    },
    {
      timestamp: 24000,
      description: "Click All to show all templates",
      action: async (page) => {
        const btn = page.locator('button:has-text("All")').first();
        if (await btn.isVisible()) await btn.click();
      },
    },
    {
      timestamp: 28000,
      description: "Scroll through template grid",
      action: async (page) => {
        await smoothScroll(page, 400);
      },
    },
    {
      timestamp: 34000,
      description: "Continue scrolling",
      action: async (page) => {
        await smoothScroll(page, 300);
      },
    },
    {
      timestamp: 40000,
      description: "Hover over a template card",
      action: async (page) => {
        const card = page.locator(".group.relative.cursor-pointer, .group.cursor-pointer").first();
        if (await card.isVisible()) await card.hover();
      },
    },
    {
      timestamp: 46000,
      description: "Hover over another template card",
      action: async (page) => {
        const card = page.locator(".group.relative.cursor-pointer, .group.cursor-pointer").nth(1);
        if (await card.isVisible()) await card.hover();
      },
    },
    {
      timestamp: 50000,
      description: "Click on first template to open preview",
      action: async (page) => {
        await page.evaluate(() =>
          window.scrollTo({ top: 0, behavior: "smooth" })
        );
        await page.waitForTimeout(1000);
        const card = page.locator(".group.relative.cursor-pointer, .group.cursor-pointer").first();
        if (await card.isVisible()) await card.click();
      },
    },
    {
      timestamp: 58000,
      description: "Wait for modal to appear",
      action: async (page) => {
        await page.waitForTimeout(2000);
      },
    },
    {
      timestamp: 65000,
      description: "Hover over download/generate button in modal",
      action: async (page) => {
        const btn = page.locator('button:has-text("Generate"), button:has-text("Download"), button:has-text("Preview")').first();
        if (await btn.isVisible()) await btn.hover();
      },
    },
    {
      timestamp: 72000,
      description: "Close modal",
      action: async (page) => {
        await page.keyboard.press("Escape");
      },
    },
    {
      timestamp: 76000,
      description: "Scroll back to top",
      action: async (page) => {
        await page.evaluate(() =>
          window.scrollTo({ top: 0, behavior: "smooth" })
        );
      },
    },
  ],
};
