import type { FeatureConfig } from "../lib/types";
import { smoothScroll } from "../lib/recorder";

const NARRATION = `Goals helps you set business objectives and track your progress with AI-generated action plans.

On the main page, you can see your goals organized with category badges like Revenue, Product, Team, Operations, and Marketing. Each goal card shows its title, a progress bar, the target date, and how many steps have been completed.

You can filter goals by status — Active, Completed, or Archived. This keeps your workspace focused on what matters right now.

Let's expand a goal to see its action plan. When you click on a goal, it reveals the full AI-generated step-by-step plan. Each step has a title, a detailed description, and a suggested timeframe. You can check off steps as you complete them, and the progress bar updates automatically.

To create a new goal, simply describe what you want to achieve and the AI generates a complete action plan with specific milestones. You can customize the title, category, target date, and individual steps.

Goals transforms vague business ambitions into concrete, trackable action plans. Whether you're preparing for a fundraise, scaling your team, or launching a new product, you'll have a clear roadmap to follow.`;

export const goals: FeatureConfig = {
  id: "goals",
  title: "Goals & Action Plans",
  route: "/goals",
  narration: NARRATION,
  estimatedDurationMs: 94_000,
  actions: [
    {
      timestamp: 4000,
      description: "Wait for goals to load",
      action: async (page) => {
        await page.waitForLoadState("networkidle");
      },
    },
    {
      timestamp: 8000,
      description: "Scroll through goal cards",
      action: async (page) => {
        await smoothScroll(page, 300);
      },
    },
    {
      timestamp: 14000,
      description: "Hover over a goal's progress bar",
      action: async (page) => {
        const progress = page.locator('[role="progressbar"], .bg-green-500.rounded-full').first();
        if (await progress.isVisible()) await progress.hover();
      },
    },
    {
      timestamp: 20000,
      description: "Scroll back to top and click Active filter",
      action: async (page) => {
        await page.evaluate(() =>
          window.scrollTo({ top: 0, behavior: "smooth" })
        );
        await page.waitForTimeout(500);
        // Status filters are links or buttons near the top
        const btn = page.locator('a:has-text("Active"), button:has-text("Active")').first();
        if (await btn.isVisible()) await btn.click();
        await page.waitForTimeout(1000);
      },
    },
    {
      timestamp: 26000,
      description: "Click Completed filter",
      action: async (page) => {
        const btn = page.locator('a:has-text("Completed"), button:has-text("Completed")').first();
        if (await btn.isVisible()) await btn.click();
        await page.waitForTimeout(1000);
      },
    },
    {
      timestamp: 30000,
      description: "Click All filter to show all goals",
      action: async (page) => {
        const btn = page.locator('a:has-text("All"), button:has-text("All")').first();
        if (await btn.isVisible()) await btn.click();
        await page.waitForTimeout(1000);
      },
    },
    {
      timestamp: 34000,
      description: "Click on a goal card to expand it",
      action: async (page) => {
        const goal = page.locator("button.w-full.text-left, [class*='rounded-xl'][class*='border'][class*='cursor']").first();
        if (await goal.isVisible()) await goal.click();
      },
    },
    {
      timestamp: 40000,
      description: "Scroll into expanded steps",
      action: async (page) => {
        await smoothScroll(page, 400);
      },
    },
    {
      timestamp: 46000,
      description: "Hover over a step title and description",
      action: async (page) => {
        const step = page.locator('[class*="items-start"][class*="gap-3"]').first();
        if (await step.isVisible()) await step.hover();
      },
    },
    {
      timestamp: 52000,
      description: "Click a step checkbox",
      action: async (page) => {
        const checkbox = page.locator('input[type="checkbox"], button[class*="rounded-full"][class*="border"]').first();
        if (await checkbox.isVisible()) await checkbox.click();
      },
    },
    {
      timestamp: 58000,
      description: "Observe progress bar update",
      action: async (page) => {
        await page.waitForTimeout(1000);
        const progress = page.locator('[role="progressbar"], .bg-green-500.rounded-full').first();
        if (await progress.isVisible()) await progress.hover();
      },
    },
    {
      timestamp: 64000,
      description: "Scroll to top for goal creation",
      action: async (page) => {
        await page.evaluate(() =>
          window.scrollTo({ top: 0, behavior: "smooth" })
        );
      },
    },
    {
      timestamp: 70000,
      description: "Hover over Set Goal / New Goal area",
      action: async (page) => {
        const input = page.locator('textarea[placeholder*="goal"], input[placeholder*="goal"], button:has-text("Set"), button:has-text("New Goal")').first();
        if (await input.isVisible()) await input.hover();
      },
    },
    {
      timestamp: 78000,
      description: "Scroll down to see goals overview",
      action: async (page) => {
        await smoothScroll(page, 300);
      },
    },
  ],
};
