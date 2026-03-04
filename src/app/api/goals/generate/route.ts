import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { getModel } from "@/lib/ai-models";
import { calculateCreditCost } from "@/lib/credits";
import { checkCreditAllowance, incrementCreditUsage } from "@/lib/usage";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are a strategic business advisor helping a leader create an actionable goal plan. Based on their goal description and business context, generate a structured plan with specific, measurable steps.

You MUST respond with valid JSON only — no markdown, no code fences, no explanation. The JSON must match this schema exactly:

{
  "title": "A concise, action-oriented goal title (under 100 chars)",
  "category": "one of: revenue, product, team, operations, marketing",
  "targetDate": "ISO date string roughly 3-6 months from now based on goal complexity",
  "steps": [
    {
      "title": "Specific action step title",
      "description": "1-2 sentence description of what this step involves",
      "timeframe": "e.g. Week 1-2, Month 1, Month 2-3"
    }
  ]
}

Guidelines:
- Generate 5-7 steps that build on each other logically
- Steps should be specific and actionable, not vague
- Timeframes should be realistic for the goal scope
- Consider the user's industry, company size, and role when making suggestions
- Each step title should start with an action verb
- Category should match the primary domain of the goal`;

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const { description } = await request.json();

        if (!description || typeof description !== "string" || description.trim().length < 10) {
            return NextResponse.json(
                { error: "Please describe your goal in at least 10 characters" },
                { status: 400 }
            );
        }

        // Pre-check credits (estimate 1 credit minimum)
        const creditCheck = await checkCreditAllowance(userId, 1);
        if (!creditCheck.allowed) {
            return NextResponse.json(
                { error: creditCheck.reason, usage: creditCheck.usage },
                { status: 403 }
            );
        }

        // Fetch user settings for business context
        let businessContext = "";
        try {
            const { db } = await import("@/db");
            const { userSettings } = await import("@/db/schema");
            const { eq } = await import("drizzle-orm");
            const [settings] = await db
                .select()
                .from(userSettings)
                .where(eq(userSettings.userId, userId))
                .limit(1);

            if (settings) {
                const parts: string[] = [];
                if (settings.industry) parts.push(`Industry: ${settings.industry}`);
                if (settings.userRole) parts.push(`Role: ${settings.userRole}`);
                if (settings.companyName) parts.push(`Company: ${settings.companyName}`);
                if (settings.companySize) parts.push(`Company size: ${settings.companySize}`);
                if (settings.productsServices) parts.push(`Products/Services: ${settings.productsServices}`);
                if (settings.currentChallenges) parts.push(`Current challenges: ${settings.currentChallenges}`);
                if (settings.shortTermGoals) parts.push(`Existing goals: ${settings.shortTermGoals}`);
                if (parts.length > 0) {
                    businessContext = `\n\nBusiness context:\n${parts.join("\n")}`;
                }
            }
        } catch (err) {
            console.error("[Goals Generate] Failed to fetch user settings:", err);
            // Continue without context — non-fatal
        }

        const userPrompt = `Create an actionable step-by-step plan for this goal:

"${description.trim()}"${businessContext}

Respond with JSON only.`;

        const model = getModel("goals");
        const message = await anthropic.messages.create({
            model,
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: userPrompt }],
        });

        const rawText =
            message.content[0].type === "text"
                ? message.content[0].text.trim()
                : "";

        // Strip markdown code fences if present
        const jsonText = rawText
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        let plan;
        try {
            plan = JSON.parse(jsonText);
        } catch {
            console.error("[Goals Generate] Failed to parse AI response:", rawText);
            return NextResponse.json(
                { error: "AI returned an invalid response. Please try again." },
                { status: 500 }
            );
        }

        // Validate plan structure
        if (!plan.title || !Array.isArray(plan.steps) || plan.steps.length === 0) {
            return NextResponse.json(
                { error: "AI returned an incomplete plan. Please try again." },
                { status: 500 }
            );
        }

        // Calculate and deduct credits
        const creditCost = calculateCreditCost(
            message.usage.input_tokens,
            message.usage.output_tokens
        );
        await incrementCreditUsage(userId, creditCost);

        console.log(
            `[Goals Generate] user=${userId} tokens=${message.usage.input_tokens}+${message.usage.output_tokens} credits=${creditCost}`
        );

        return NextResponse.json({
            plan,
            aiModel: model,
            creditCost,
        });
    } catch (error) {
        console.error("[Goals Generate] Error:", error);
        return NextResponse.json(
            { error: "Failed to generate goal plan" },
            { status: 500 }
        );
    }
}
