import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { getModel } from "@/lib/ai-models";

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

// Field-specific prompt builders
const FIELD_PROMPTS: Record<string, (ctx: Record<string, string>) => string> = {
    areasOfFocus: (ctx) => {
        const parts = [];
        if (ctx.userRole) parts.push(`Role: ${ctx.userRole}`);
        if (ctx.yearsExperience) parts.push(`Experience: ${ctx.yearsExperience}`);
        const context = parts.length > 0 ? parts.join(". ") + "." : "a business leader";
        return `Based on this person's profile: ${context}

Suggest what they likely spend most of their time on as a leader. Write 3-5 focus areas as a comma-separated list. Be specific and practical. Example format: "Product strategy and roadmap, fundraising and investor relations, hiring and team building, customer acquisition"

Return ONLY the comma-separated list, no preamble or explanation.`;
    },

    productsServices: (ctx) => {
        const parts = [];
        if (ctx.companyName) parts.push(`Company: ${ctx.companyName}`);
        if (ctx.industry) parts.push(`Industry: ${ctx.industry}`);
        if (ctx.companySize) parts.push(`Size: ${ctx.companySize}`);
        if (ctx.userRole) parts.push(`Leader's role: ${ctx.userRole}`);
        const context = parts.length > 0 ? parts.join(". ") + "." : "a business";
        return `Based on this company profile: ${context}

Write a brief 1-2 sentence description of what this company likely does — its products or services and target customers. Be specific to the industry and company size. Write as if the founder is describing their own company.

Return ONLY the description, no preamble.`;
    },

    currentChallenges: (ctx) => {
        const parts = [];
        if (ctx.userRole) parts.push(`Role: ${ctx.userRole}`);
        if (ctx.companyName) parts.push(`Company: ${ctx.companyName}`);
        if (ctx.industry) parts.push(`Industry: ${ctx.industry}`);
        if (ctx.companySize) parts.push(`Size: ${ctx.companySize}`);
        if (ctx.productsServices) parts.push(`What they do: ${ctx.productsServices}`);
        if (ctx.areasOfFocus) parts.push(`Focus areas: ${ctx.areasOfFocus}`);
        const context = parts.length > 0 ? parts.join(". ") + "." : "a business leader";
        return `Based on this business profile: ${context}

Suggest 3-4 realistic business challenges this leader is likely facing right now. Be specific to their industry, company size, and role. Write as a comma-separated list from their perspective.

Example format: "Scaling operations while maintaining quality, finding and retaining senior engineering talent, building a repeatable sales process, managing cash flow during growth phase"

Return ONLY the comma-separated list, no preamble.`;
    },

    shortTermGoals: (ctx) => {
        const parts = [];
        if (ctx.userRole) parts.push(`Role: ${ctx.userRole}`);
        if (ctx.companyName) parts.push(`Company: ${ctx.companyName}`);
        if (ctx.industry) parts.push(`Industry: ${ctx.industry}`);
        if (ctx.companySize) parts.push(`Size: ${ctx.companySize}`);
        if (ctx.productsServices) parts.push(`What they do: ${ctx.productsServices}`);
        if (ctx.currentChallenges) parts.push(`Current challenges: ${ctx.currentChallenges}`);
        const context = parts.length > 0 ? parts.join(". ") + "." : "a business leader";
        return `Based on this business profile: ${context}

Suggest 3-4 realistic goals for the next 3-6 months that would address their challenges and move the business forward. Be specific and actionable. Write as a comma-separated list from their perspective.

Example format: "Launch v2 of the product with enterprise features, grow monthly revenue to $50K, hire a VP of Sales and 2 senior engineers, establish partnerships with 3 industry leaders"

Return ONLY the comma-separated list, no preamble.`;
    },
};

const SYSTEM_PROMPT = `You are a concise business advisor helping a new user set up their profile. Generate practical, specific suggestions based on the context provided. Keep suggestions realistic and relevant to their industry and role. Never use generic filler — be specific. Always respond with ONLY the requested content, no introductions, explanations, or formatting.`;

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { field, context } = await request.json();

        // Validate field
        const promptBuilder = FIELD_PROMPTS[field];
        if (!promptBuilder) {
            return NextResponse.json(
                { error: "Invalid field" },
                { status: 400 }
            );
        }

        // Build the prompt using available context
        const userPrompt = promptBuilder(context || {});

        // Call Claude (no credit deduction — onboarding is free)
        const message = await anthropic.messages.create({
            model: getModel("onboarding"),
            max_tokens: 300,
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: userPrompt }],
        });

        const suggestion =
            message.content[0].type === "text"
                ? message.content[0].text.trim()
                : "";

        console.log(
            `[Onboarding Suggest] field=${field} tokens=${message.usage.input_tokens}+${message.usage.output_tokens}`
        );

        return NextResponse.json({ suggestion });
    } catch (error) {
        console.error("[Onboarding Suggest] Error:", error);
        return NextResponse.json(
            { error: "Failed to generate suggestion" },
            { status: 500 }
        );
    }
}
