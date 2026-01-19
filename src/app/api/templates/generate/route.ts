// src/app/api/templates/generate/route.ts
// Generate document templates for paid users

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserUsage } from "@/lib/usage";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

// Template metadata for validation
const VALID_TEMPLATES = [
    "business-plan",
    "pitch-deck",
    "meeting-notes",
    "project-proposal",
    "invoice",
    "expense-report",
    "employee-handbook",
    "job-description",
    "marketing-plan",
    "brand-guidelines",
] as const;

type TemplateId = (typeof VALID_TEMPLATES)[number];

// User settings interface
interface UserSettingsData {
    companyName?: string;
    industry?: string;
    companySize?: string;
    annualRevenue?: string;
    productsServices?: string;
    targetMarket?: string;
    userRole?: string;
    yearsExperience?: string;
    areasOfFocus?: string;
    currentChallenges?: string;
    shortTermGoals?: string;
    longTermGoals?: string;
    techStack?: string;
    teamStructure?: string;
    communicationStyle?: string;
    responseLength?: string;
}

export async function POST(request: NextRequest) {
    try {
        // 1. Verify authentication
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        // 2. Check if user is on paid tier
        const usage = await getUserUsage(session.user.id);
        if (usage.tier === "free") {
            return NextResponse.json(
                { error: "Document generation requires a paid subscription" },
                { status: 403 }
            );
        }

        // 3. Parse and validate request
        const body = await request.json();
        const { templateId } = body as { templateId: string };

        if (!templateId || !VALID_TEMPLATES.includes(templateId as TemplateId)) {
            return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });
        }

        // 4. Fetch user settings from database
        let settings: UserSettingsData = {};
        try {
            const [settingsRecord] = await db
                .select()
                .from(userSettings)
                .where(eq(userSettings.userId, session.user.id));

            if (settingsRecord) {
                // Settings are stored as direct columns, not nested
                settings = {
                    companyName: settingsRecord.companyName ?? undefined,
                    industry: settingsRecord.industry ?? undefined,
                    companySize: settingsRecord.companySize ?? undefined,
                    annualRevenue: settingsRecord.annualRevenue ?? undefined,
                    productsServices: settingsRecord.productsServices ?? undefined,
                    targetMarket: settingsRecord.targetMarket ?? undefined,
                    userRole: settingsRecord.userRole ?? undefined,
                    yearsExperience: settingsRecord.yearsExperience ?? undefined,
                    areasOfFocus: settingsRecord.areasOfFocus ?? undefined,
                    currentChallenges: settingsRecord.currentChallenges ?? undefined,
                    shortTermGoals: settingsRecord.shortTermGoals ?? undefined,
                    longTermGoals: settingsRecord.longTermGoals ?? undefined,
                    techStack: settingsRecord.techStack ?? undefined,
                    teamStructure: settingsRecord.teamStructure ?? undefined,
                    communicationStyle: settingsRecord.communicationStyle ?? undefined,
                    responseLength: settingsRecord.responseLength ?? undefined,
                };
            }
        } catch (err) {
            console.log("[Document Generate] Could not fetch settings:", err);
            // Continue with empty settings
        }

        // 5. Generate the document based on template type
        const result = await generateDocument(
            templateId as TemplateId,
            session.user,
            settings
        );

        // 6. Return the document as Uint8Array (compatible with NextResponse)
        return new NextResponse(new Uint8Array(result.buffer), {
            headers: {
                "Content-Type": result.contentType,
                "Content-Disposition": `attachment; filename="${result.filename}"`,
            },
        });
    } catch (error) {
        console.error("[Document Generate] Error:", error);
        return NextResponse.json(
            { error: "Failed to generate document" },
            { status: 500 }
        );
    }
}

interface GenerateResult {
    buffer: Buffer;
    contentType: string;
    filename: string;
}

async function generateDocument(
    templateId: TemplateId,
    user: { name?: string | null; email?: string | null },
    settings: UserSettingsData
): Promise<GenerateResult> {
    const userName = user.name || "User";
    const userEmail = user.email || "";
    const today = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

    switch (templateId) {
        // Word Documents
        case "business-plan":
            return generateBusinessPlan(userName, today, settings);
        case "meeting-notes":
            return generateMeetingNotes(userName, today, settings);
        case "project-proposal":
            return generateProjectProposal(userName, today, settings);
        case "job-description":
            return generateJobDescription(userName, today, settings);
        case "employee-handbook":
            return generateEmployeeHandbook(userName, today, settings);
        case "marketing-plan":
            return generateMarketingPlan(userName, today, settings);

        // PowerPoint
        case "pitch-deck":
            return generatePitchDeck(userName, today, settings);

        // Excel
        case "expense-report":
            return generateExpenseReport(userName, today, settings);

        // PDF
        case "invoice":
            return generateInvoice(userName, userEmail, today, settings);
        case "brand-guidelines":
            return generateBrandGuidelines(userName, today, settings);

        default:
            throw new Error(`Unknown template: ${templateId}`);
    }
}

// ============================================
// WORD DOCUMENT GENERATORS (using docx)
// ============================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateWordDoc(sections: any[]): Promise<Buffer> {
    const {
        Document,
        Packer,
    } = await import("docx");

    const doc = new Document({ sections });
    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
}

// Page properties for US Letter size
const pageProperties = {
    page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
    },
};

async function generateBusinessPlan(userName: string, today: string, settings: UserSettingsData): Promise<GenerateResult> {
    const { Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx");

    const companyName = settings.companyName || "[Your Company Name]";
    const industry = settings.industry || "[Your Industry]";
    const companySize = settings.companySize || "[Company Size]";
    const revenue = settings.annualRevenue || "[Current Revenue]";
    const products = settings.productsServices || "[Describe your products and services here]";
    const targetMarket = settings.targetMarket || "[Describe your target market and ideal customers]";
    const challenges = settings.currentChallenges || "[List your current business challenges]";
    const shortTermGoals = settings.shortTermGoals || "[Your goals for the next 3-6 months]";
    const longTermGoals = settings.longTermGoals || "[Your goals for the next 1-3 years]";

    const buffer = await generateWordDoc([{
        properties: pageProperties,
        children: [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "BUSINESS PLAN", bold: true, size: 48 })],
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: companyName, size: 32 })],
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
                children: [new TextRun({ text: `Prepared by ${userName} | ${today}`, size: 24, color: "666666" })],
            }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "1. Executive Summary", bold: true })] }),
            new Paragraph({ children: [new TextRun(`${companyName} is a ${companySize} company in the ${industry} industry. `)] }),
            new Paragraph({ children: [new TextRun({ text: "\nOur Products/Services: ", bold: true }), new TextRun(products)] }),
            new Paragraph({ children: [new TextRun({ text: "\nTarget Market: ", bold: true }), new TextRun(targetMarket)] }),
            new Paragraph({ children: [new TextRun({ text: "\nCurrent Revenue: ", bold: true }), new TextRun(revenue)] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "2. Company Description", bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: "Company Name: ", bold: true }), new TextRun(companyName)] }),
            new Paragraph({ children: [new TextRun({ text: "Industry: ", bold: true }), new TextRun(industry)] }),
            new Paragraph({ children: [new TextRun({ text: "Company Size: ", bold: true }), new TextRun(companySize)] }),
            new Paragraph({ children: [new TextRun("\n[Add more details about your company history, legal structure, and location]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "3. Market Analysis", bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: "Target Market: ", bold: true })] }),
            new Paragraph({ children: [new TextRun(targetMarket)] }),
            new Paragraph({ children: [new TextRun("\n[Add market size, growth potential, and competitive analysis]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "4. Products and Services", bold: true })] }),
            new Paragraph({ children: [new TextRun(products)] }),
            new Paragraph({ children: [new TextRun("\n[Add pricing strategy, product roadmap, and competitive advantages]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "5. Current Challenges", bold: true })] }),
            new Paragraph({ children: [new TextRun(challenges)] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "6. Goals & Objectives", bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: "Short-term Goals (3-6 months):", bold: true })] }),
            new Paragraph({ children: [new TextRun(shortTermGoals)] }),
            new Paragraph({ children: [new TextRun({ text: "\nLong-term Goals (1-3 years):", bold: true })] }),
            new Paragraph({ children: [new TextRun(longTermGoals)] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "7. Financial Projections", bold: true })] }),
            new Paragraph({ children: [new TextRun("[Include revenue forecasts, profit and loss projections, cash flow statements, and break-even analysis.]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "8. Funding Request", bold: true })] }),
            new Paragraph({ children: [new TextRun("[If seeking funding, specify the amount needed and how the funds will be used.]")] }),
        ],
    }]);

    return {
        buffer,
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename: "business-plan.docx",
    };
}

async function generateMeetingNotes(userName: string, today: string, settings: UserSettingsData): Promise<GenerateResult> {
    const { Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx");

    const companyName = settings.companyName || "[Company Name]";
    const userRole = settings.userRole || "[Your Role]";

    const buffer = await generateWordDoc([{
        properties: pageProperties,
        children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MEETING NOTES", bold: true, size: 40 })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: companyName, size: 24, color: "666666" })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: today, size: 20, color: "888888" })] }),
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Meeting Details", bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: "Date: ", bold: true }), new TextRun(today)] }),
            new Paragraph({ children: [new TextRun({ text: "Time: ", bold: true }), new TextRun("[Time]")] }),
            new Paragraph({ children: [new TextRun({ text: "Location: ", bold: true }), new TextRun("[Location/Virtual]")] }),
            new Paragraph({ children: [new TextRun({ text: "Facilitator: ", bold: true }), new TextRun(`${userName} (${userRole})`)] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Attendees", bold: true })] }),
            new Paragraph({ children: [new TextRun("- [Name 1]")] }),
            new Paragraph({ children: [new TextRun("- [Name 2]")] }),
            new Paragraph({ children: [new TextRun("- [Name 3]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Agenda", bold: true })] }),
            new Paragraph({ children: [new TextRun("1. [Topic 1]")] }),
            new Paragraph({ children: [new TextRun("2. [Topic 2]")] }),
            new Paragraph({ children: [new TextRun("3. [Topic 3]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Discussion Notes", bold: true })] }),
            new Paragraph({ children: [new TextRun("[Add detailed notes from the discussion here]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Action Items", bold: true })] }),
            new Paragraph({ children: [new TextRun("[ ] [Action item 1] - Assigned to: [Name] - Due: [Date]")] }),
            new Paragraph({ children: [new TextRun("[ ] [Action item 2] - Assigned to: [Name] - Due: [Date]")] }),
            new Paragraph({ children: [new TextRun("[ ] [Action item 3] - Assigned to: [Name] - Due: [Date]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Next Meeting", bold: true })] }),
            new Paragraph({ children: [new TextRun("Date: [Next meeting date]")] }),
            new Paragraph({ children: [new TextRun("Topics to cover: [Topics]")] }),
        ],
    }]);

    return {
        buffer,
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename: "meeting-notes.docx",
    };
}

async function generateProjectProposal(userName: string, today: string, settings: UserSettingsData): Promise<GenerateResult> {
    const { Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx");

    const companyName = settings.companyName || "[Company Name]";
    const userRole = settings.userRole || "[Your Role]";
    const techStack = settings.techStack || "[List relevant technologies and tools]";
    const shortTermGoals = settings.shortTermGoals || "[Project objectives aligned with business goals]";

    const buffer = await generateWordDoc([{
        properties: pageProperties,
        children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PROJECT PROPOSAL", bold: true, size: 48 })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "[Project Name]", size: 32 })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: `${companyName} | Prepared by ${userName} (${userRole}) | ${today}`, size: 20, color: "666666" })] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Project Overview", bold: true })] }),
            new Paragraph({ children: [new TextRun("[Provide a brief description of the project and its objectives.]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Business Objectives", bold: true })] }),
            new Paragraph({ children: [new TextRun("This project aligns with our current business goals:")] }),
            new Paragraph({ children: [new TextRun(shortTermGoals)] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Scope of Work", bold: true })] }),
            new Paragraph({ children: [new TextRun("[Detail the specific tasks, deliverables, and boundaries of the project.]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Technology & Tools", bold: true })] }),
            new Paragraph({ children: [new TextRun("This project will utilize our existing technology stack:")] }),
            new Paragraph({ children: [new TextRun(techStack)] }),
            new Paragraph({ children: [new TextRun("\n[Add any additional technologies needed for this project]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Timeline", bold: true })] }),
            new Paragraph({ children: [new TextRun("Phase 1: [Description] - [Duration]")] }),
            new Paragraph({ children: [new TextRun("Phase 2: [Description] - [Duration]")] }),
            new Paragraph({ children: [new TextRun("Phase 3: [Description] - [Duration]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Budget", bold: true })] }),
            new Paragraph({ children: [new TextRun("[Provide a detailed breakdown of project costs.]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Team and Resources", bold: true })] }),
            new Paragraph({ children: [new TextRun("[List team members and required resources.]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: "Success Metrics", bold: true })] }),
            new Paragraph({ children: [new TextRun("[Define how success will be measured.]")] }),
        ],
    }]);

    return {
        buffer,
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename: "project-proposal.docx",
    };
}

async function generateJobDescription(_userName: string, _today: string, settings: UserSettingsData): Promise<GenerateResult> {
    const { Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx");

    const companyName = settings.companyName || "[Company Name]";
    const industry = settings.industry || "[Industry]";
    const companySize = settings.companySize || "[Company Size]";
    const products = settings.productsServices || "[Brief description of products/services]";

    const buffer = await generateWordDoc([{
        properties: pageProperties,
        children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "JOB DESCRIPTION", bold: true, size: 40 })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: "[Job Title]", size: 32 })] }),
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "About the Company", bold: true })] }),
            new Paragraph({ children: [new TextRun({ text: companyName, bold: true }), new TextRun(` is a ${companySize} company in the ${industry} industry.`)] }),
            new Paragraph({ children: [new TextRun(products)] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Position Overview", bold: true })] }),
            new Paragraph({ children: [new TextRun("[Brief description of the role and its importance to the organization]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Responsibilities", bold: true })] }),
            new Paragraph({ children: [new TextRun("- [Responsibility 1]")] }),
            new Paragraph({ children: [new TextRun("- [Responsibility 2]")] }),
            new Paragraph({ children: [new TextRun("- [Responsibility 3]")] }),
            new Paragraph({ children: [new TextRun("- [Responsibility 4]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Requirements", bold: true })] }),
            new Paragraph({ children: [new TextRun("- [Requirement 1]")] }),
            new Paragraph({ children: [new TextRun("- [Requirement 2]")] }),
            new Paragraph({ children: [new TextRun("- [Requirement 3]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Nice to Have", bold: true })] }),
            new Paragraph({ children: [new TextRun("- [Nice to have 1]")] }),
            new Paragraph({ children: [new TextRun("- [Nice to have 2]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "Benefits", bold: true })] }),
            new Paragraph({ children: [new TextRun("- Competitive salary")] }),
            new Paragraph({ children: [new TextRun("- Health insurance")] }),
            new Paragraph({ children: [new TextRun("- [Other benefits]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: "How to Apply", bold: true })] }),
            new Paragraph({ children: [new TextRun(`Please send your resume to [email] with the subject line "[Job Title] Application".`)] }),
        ],
    }]);

    return {
        buffer,
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename: "job-description.docx",
    };
}

async function generateEmployeeHandbook(_userName: string, today: string, settings: UserSettingsData): Promise<GenerateResult> {
    const { Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx");

    const companyName = settings.companyName || "[Company Name]";
    const industry = settings.industry || "[Industry]";
    const companySize = settings.companySize || "[Company Size]";
    const teamStructure = settings.teamStructure || "[Describe your organizational structure]";

    const buffer = await generateWordDoc([{
        properties: pageProperties,
        children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "EMPLOYEE HANDBOOK", bold: true, size: 48 })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: companyName, size: 32 })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: `Last Updated: ${today}`, size: 22, color: "666666" })] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Welcome")] }),
            new Paragraph({ children: [new TextRun(`Welcome to ${companyName}! We're excited to have you join our team.`)] }),
            new Paragraph({ children: [new TextRun(`As a ${companySize} company in the ${industry} industry, we value [add your core values here].`)] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Company Overview")] }),
            new Paragraph({ children: [new TextRun({ text: "Our Mission: ", bold: true }), new TextRun("[Your mission statement]")] }),
            new Paragraph({ children: [new TextRun({ text: "Our Vision: ", bold: true }), new TextRun("[Your vision statement]")] }),
            new Paragraph({ children: [new TextRun({ text: "Our Values: ", bold: true }), new TextRun("[Your core values]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Organizational Structure")] }),
            new Paragraph({ children: [new TextRun(teamStructure)] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Employment Policies")] }),
            new Paragraph({ children: [new TextRun("[Equal opportunity statement, at-will employment, etc.]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Compensation & Benefits")] }),
            new Paragraph({ children: [new TextRun("[Pay periods, benefits overview, PTO policy]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Workplace Conduct")] }),
            new Paragraph({ children: [new TextRun("[Code of conduct, dress code, attendance]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Safety & Security")] }),
            new Paragraph({ children: [new TextRun("[Workplace safety, emergency procedures]")] }),
        ],
    }]);

    return {
        buffer,
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename: "employee-handbook.docx",
    };
}

async function generateMarketingPlan(_userName: string, today: string, settings: UserSettingsData): Promise<GenerateResult> {
    const { Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx");

    const companyName = settings.companyName || "[Company Name]";
    const industry = settings.industry || "[Industry]";
    const products = settings.productsServices || "[Your products/services]";
    const targetMarket = settings.targetMarket || "[Your target market description]";
    const shortTermGoals = settings.shortTermGoals || "[Your marketing goals for next 3-6 months]";

    const buffer = await generateWordDoc([{
        properties: pageProperties,
        children: [
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MARKETING PLAN", bold: true, size: 48 })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: companyName, size: 32 })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 }, children: [new TextRun({ text: today, size: 24, color: "666666" })] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Executive Summary")] }),
            new Paragraph({ children: [new TextRun(`${companyName} operates in the ${industry} industry, offering:`)] }),
            new Paragraph({ children: [new TextRun(products)] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Target Audience")] }),
            new Paragraph({ children: [new TextRun(targetMarket)] }),
            new Paragraph({ children: [new TextRun("\n[Add demographics, psychographics, and detailed buyer personas]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Marketing Goals")] }),
            new Paragraph({ children: [new TextRun("Our marketing objectives for the next 3-6 months:")] }),
            new Paragraph({ children: [new TextRun(shortTermGoals)] }),
            new Paragraph({ children: [new TextRun("\n[Add specific SMART goals and KPIs]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Marketing Channels")] }),
            new Paragraph({ children: [new TextRun("Primary Channels:")] }),
            new Paragraph({ children: [new TextRun("- [Social media platforms]")] }),
            new Paragraph({ children: [new TextRun("- [Email marketing]")] }),
            new Paragraph({ children: [new TextRun("- [Content marketing]")] }),
            new Paragraph({ children: [new TextRun("- [Paid advertising]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Budget")] }),
            new Paragraph({ children: [new TextRun("[Budget allocation by channel]")] }),
            new Paragraph({ children: [] }),
            new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Timeline")] }),
            new Paragraph({ children: [new TextRun("[Campaign calendar and milestones]")] }),
        ],
    }]);

    return {
        buffer,
        contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename: "marketing-plan.docx",
    };
}

// ============================================
// POWERPOINT GENERATOR (using pptxgenjs)
// ============================================

async function generatePitchDeck(userName: string, _today: string, settings: UserSettingsData): Promise<GenerateResult> {
    const PptxGenJS = (await import("pptxgenjs")).default;

    const companyName = settings.companyName || "[Company Name]";
    const industry = settings.industry || "[Industry]";
    const products = settings.productsServices || "[Your product/service description]";
    const targetMarket = settings.targetMarket || "[Your target market]";
    const challenges = settings.currentChallenges || "[Problems you solve]";
    const revenue = settings.annualRevenue || "$[X]";
    const companySize = settings.companySize || "[Team Size]";
    const longTermGoals = settings.longTermGoals || "[Your vision for the future]";

    const pptx = new PptxGenJS();
    pptx.layout = "LAYOUT_16x9";
    pptx.title = "Pitch Deck";
    pptx.author = userName;

    // Slide 1: Title
    let slide = pptx.addSlide();
    slide.addText(companyName, { x: 0.5, y: 2, w: 9, h: 1.5, fontSize: 44, bold: true, color: "363636", align: "center" });
    slide.addText(products.substring(0, 100) + (products.length > 100 ? "..." : ""), { x: 0.5, y: 3.5, w: 9, h: 0.75, fontSize: 20, color: "666666", align: "center" });
    slide.addText(`Presented by ${userName}`, { x: 0.5, y: 4.5, w: 9, h: 0.5, fontSize: 16, color: "999999", align: "center" });

    // Slide 2: Problem
    slide = pptx.addSlide();
    slide.addText("The Problem", { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 36, bold: true, color: "363636" });
    slide.addText(challenges, { x: 0.5, y: 1.75, w: 9, h: 3, fontSize: 18, color: "666666" });

    // Slide 3: Solution
    slide = pptx.addSlide();
    slide.addText("Our Solution", { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 36, bold: true, color: "363636" });
    slide.addText(products, { x: 0.5, y: 1.75, w: 9, h: 2.5, fontSize: 18, color: "444444" });

    // Slide 4: Market Size
    slide = pptx.addSlide();
    slide.addText("Market Opportunity", { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 36, bold: true, color: "363636" });
    slide.addText(`Industry: ${industry}`, { x: 0.5, y: 1.75, w: 9, h: 0.5, fontSize: 20, bold: true, color: "444444" });
    slide.addText(`Target Market:\n${targetMarket}`, { x: 0.5, y: 2.5, w: 9, h: 2, fontSize: 18, color: "666666" });

    // Slide 5: Business Model
    slide = pptx.addSlide();
    slide.addText("Business Model", { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 36, bold: true, color: "363636" });
    slide.addText(`Current Revenue: ${revenue}\n\nHow We Make Money:\n• [Revenue stream 1]\n• [Revenue stream 2]\n• [Pricing model]`, { x: 0.5, y: 1.75, w: 9, h: 2.5, fontSize: 18, color: "666666" });

    // Slide 6: Traction
    slide = pptx.addSlide();
    slide.addText("Traction", { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 36, bold: true, color: "363636" });
    slide.addText(`Current Revenue\n${revenue}`, { x: 0.5, y: 1.75, w: 2.75, h: 1.5, fontSize: 18, color: "666666", align: "center" });
    slide.addText(`Team Size\n${companySize}`, { x: 3.5, y: 1.75, w: 2.75, h: 1.5, fontSize: 18, color: "666666", align: "center" });
    slide.addText("[X]%\nMoM Growth", { x: 6.5, y: 1.75, w: 2.75, h: 1.5, fontSize: 18, color: "666666", align: "center" });

    // Slide 7: Competition
    slide = pptx.addSlide();
    slide.addText("Competitive Landscape", { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 36, bold: true, color: "363636" });
    slide.addText("Our Advantages:\n• [Differentiator 1]\n• [Differentiator 2]\n• [Differentiator 3]", { x: 0.5, y: 1.75, w: 9, h: 2.5, fontSize: 20, color: "666666" });

    // Slide 8: Team
    slide = pptx.addSlide();
    slide.addText("The Team", { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 36, bold: true, color: "363636" });
    slide.addText(`${userName}\nFounder\n[Background]`, { x: 0.5, y: 1.75, w: 2.75, h: 2, fontSize: 14, color: "666666", align: "center" });
    slide.addText("[Co-founder]\n[Role]\n[Background]", { x: 3.5, y: 1.75, w: 2.75, h: 2, fontSize: 14, color: "666666", align: "center" });
    slide.addText("[Key Hire]\n[Role]\n[Background]", { x: 6.5, y: 1.75, w: 2.75, h: 2, fontSize: 14, color: "666666", align: "center" });

    // Slide 9: Vision & Goals
    slide = pptx.addSlide();
    slide.addText("Our Vision", { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 36, bold: true, color: "363636" });
    slide.addText(longTermGoals, { x: 0.5, y: 1.75, w: 9, h: 2.5, fontSize: 18, color: "666666" });

    // Slide 10: The Ask
    slide = pptx.addSlide();
    slide.addText("The Ask", { x: 0.5, y: 0.5, w: 9, h: 1, fontSize: 36, bold: true, color: "363636" });
    slide.addText("Raising $[X]", { x: 0.5, y: 1.75, w: 9, h: 0.75, fontSize: 32, bold: true, color: "444444", align: "center" });
    slide.addText("Use of Funds:\n• [X]% Product Development\n• [X]% Sales & Marketing\n• [X]% Operations", { x: 0.5, y: 2.75, w: 9, h: 2, fontSize: 18, color: "666666", align: "center" });

    // Slide 11: Contact
    slide = pptx.addSlide();
    slide.addText("Thank You", { x: 0.5, y: 2, w: 9, h: 1, fontSize: 44, bold: true, color: "363636", align: "center" });
    slide.addText(`${userName}\n[your@email.com]`, { x: 0.5, y: 3.5, w: 9, h: 1, fontSize: 20, color: "666666", align: "center" });

    const buffer = await pptx.write({ outputType: "nodebuffer" }) as Buffer;

    return {
        buffer,
        contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        filename: "pitch-deck.pptx",
    };
}

// ============================================
// EXCEL GENERATOR (using exceljs)
// ============================================

async function generateExpenseReport(userName: string, today: string, settings: UserSettingsData): Promise<GenerateResult> {
    const ExcelJS = await import("exceljs");

    const companyName = settings.companyName || "[Company Name]";
    const userRole = settings.userRole || "[Role]";

    const workbook = new ExcelJS.Workbook();
    workbook.creator = userName;
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Expense Report");

    // Title
    worksheet.mergeCells("A1:E1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = "EXPENSE REPORT";
    titleCell.font = { size: 20, bold: true };
    titleCell.alignment = { horizontal: "center" };

    // Company name
    worksheet.mergeCells("A2:E2");
    const companyCell = worksheet.getCell("A2");
    companyCell.value = companyName;
    companyCell.font = { size: 14 };
    companyCell.alignment = { horizontal: "center" };

    // Metadata
    worksheet.getCell("A4").value = "Employee:";
    worksheet.getCell("A4").font = { bold: true };
    worksheet.getCell("B4").value = userName;
    worksheet.getCell("A5").value = "Role:";
    worksheet.getCell("A5").font = { bold: true };
    worksheet.getCell("B5").value = userRole;
    worksheet.getCell("A6").value = "Date:";
    worksheet.getCell("A6").font = { bold: true };
    worksheet.getCell("B6").value = today;
    worksheet.getCell("A7").value = "Department:";
    worksheet.getCell("A7").font = { bold: true };
    worksheet.getCell("B7").value = "[Department]";

    // Headers
    const headerRow = worksheet.getRow(9);
    headerRow.values = ["Date", "Category", "Description", "Amount", "Receipt"];
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };
        cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
        };
    });

    // Sample rows
    const categories = ["Travel", "Meals", "Supplies", "Software", "Other"];
    for (let i = 0; i < 10; i++) {
        const row = worksheet.getRow(10 + i);
        row.values = ["[Date]", categories[i % categories.length], "[Description]", 0.00, "[ ]"];
        row.eachCell((cell) => {
            cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
            };
        });
    }

    // Format amount column as currency
    worksheet.getColumn(4).numFmt = '"$"#,##0.00';

    // Total row
    const totalRow = worksheet.getRow(20);
    totalRow.values = ["", "", "TOTAL:", { formula: "SUM(D10:D19)" }, ""];
    totalRow.font = { bold: true };
    worksheet.getCell("D20").numFmt = '"$"#,##0.00';

    // Approval section
    worksheet.getCell("A22").value = "Approval:";
    worksheet.getCell("A22").font = { bold: true };
    worksheet.getCell("A23").value = "Manager Signature: _______________________";
    worksheet.getCell("A24").value = "Date: _______________________";

    // Column widths
    worksheet.getColumn(1).width = 15;
    worksheet.getColumn(2).width = 15;
    worksheet.getColumn(3).width = 40;
    worksheet.getColumn(4).width = 15;
    worksheet.getColumn(5).width = 10;

    const buffer = await workbook.xlsx.writeBuffer();

    return {
        buffer: Buffer.from(buffer),
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename: "expense-report.xlsx",
    };
}

// ============================================
// PDF GENERATORS (using pdf-lib)
// ============================================

async function generateInvoice(userName: string, userEmail: string, today: string, settings: UserSettingsData): Promise<GenerateResult> {
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

    const companyName = settings.companyName || "[Your Company Name]";

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // US Letter size
    const { height } = page.getSize();

    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    let y = height - 50;

    // Header - INVOICE
    page.drawText("INVOICE", { x: 450, y, size: 28, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
    y -= 25;
    page.drawText(`Invoice #: ${invoiceNumber}`, { x: 420, y, size: 10, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
    y -= 15;
    page.drawText(`Date: ${today}`, { x: 420, y, size: 10, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
    y -= 40;

    // From section
    page.drawText("From:", { x: 50, y, size: 12, font: helveticaBold });
    y -= 18;
    page.drawText(companyName, { x: 50, y, size: 11, font: helveticaBold });
    y -= 15;
    page.drawText(userName, { x: 50, y, size: 10, font: helvetica });
    y -= 15;
    page.drawText(userEmail || "[your@email.com]", { x: 50, y, size: 10, font: helvetica });
    y -= 15;
    page.drawText("[Your Address]", { x: 50, y, size: 10, font: helvetica });
    y -= 15;
    page.drawText("[City, State ZIP]", { x: 50, y, size: 10, font: helvetica });
    y -= 30;

    // Bill To section
    page.drawText("Bill To:", { x: 50, y, size: 12, font: helveticaBold });
    y -= 18;
    page.drawText("[Client Name]", { x: 50, y, size: 10, font: helvetica });
    y -= 15;
    page.drawText("[Client Email]", { x: 50, y, size: 10, font: helvetica });
    y -= 15;
    page.drawText("[Client Address]", { x: 50, y, size: 10, font: helvetica });
    y -= 15;
    page.drawText("[City, State ZIP]", { x: 50, y, size: 10, font: helvetica });
    y -= 40;

    // Table header
    page.drawText("Description", { x: 50, y, size: 10, font: helveticaBold });
    page.drawText("Qty", { x: 300, y, size: 10, font: helveticaBold });
    page.drawText("Rate", { x: 380, y, size: 10, font: helveticaBold });
    page.drawText("Amount", { x: 480, y, size: 10, font: helveticaBold });
    y -= 5;

    // Line under header
    page.drawLine({ start: { x: 50, y }, end: { x: 560, y }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 20;

    // Table rows
    const items = [
        { desc: "[Service/Product 1]", qty: "1", rate: "$0.00", amount: "$0.00" },
        { desc: "[Service/Product 2]", qty: "1", rate: "$0.00", amount: "$0.00" },
        { desc: "[Service/Product 3]", qty: "1", rate: "$0.00", amount: "$0.00" },
    ];

    for (const item of items) {
        page.drawText(item.desc, { x: 50, y, size: 10, font: helvetica });
        page.drawText(item.qty, { x: 300, y, size: 10, font: helvetica });
        page.drawText(item.rate, { x: 380, y, size: 10, font: helvetica });
        page.drawText(item.amount, { x: 480, y, size: 10, font: helvetica });
        y -= 20;
    }

    // Line before totals
    page.drawLine({ start: { x: 50, y: y + 10 }, end: { x: 560, y: y + 10 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
    y -= 15;

    // Totals
    page.drawText("Subtotal:", { x: 380, y, size: 10, font: helvetica });
    page.drawText("$0.00", { x: 480, y, size: 10, font: helvetica });
    y -= 18;
    page.drawText("Tax (0%):", { x: 380, y, size: 10, font: helvetica });
    page.drawText("$0.00", { x: 480, y, size: 10, font: helvetica });
    y -= 18;
    page.drawText("Total:", { x: 380, y, size: 12, font: helveticaBold });
    page.drawText("$0.00", { x: 480, y, size: 12, font: helveticaBold });
    y -= 50;

    // Payment terms
    page.drawText("Payment Terms:", { x: 50, y, size: 10, font: helveticaBold });
    y -= 15;
    page.drawText("Due upon receipt. Please make payment to [payment details].", { x: 50, y, size: 10, font: helvetica });
    y -= 40;

    // Thank you
    page.drawText("Thank you for your business!", { x: 220, y, size: 12, font: helvetica, color: rgb(0.5, 0.5, 0.5) });

    const pdfBytes = await pdfDoc.save();

    return {
        buffer: Buffer.from(pdfBytes),
        contentType: "application/pdf",
        filename: "invoice.pdf",
    };
}

async function generateBrandGuidelines(_userName: string, today: string, settings: UserSettingsData): Promise<GenerateResult> {
    const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");

    const companyName = settings.companyName || "[Company Name]";
    const industry = settings.industry || "[Industry]";
    const products = settings.productsServices || "[Your products/services]";

    const pdfDoc = await PDFDocument.create();
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const helveticaOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Page 1: Cover
    let page = pdfDoc.addPage([612, 792]);
    let { height } = page.getSize();

    page.drawText("BRAND", { x: 220, y: height - 280, size: 48, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText("GUIDELINES", { x: 175, y: height - 340, size: 48, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
    page.drawText(companyName, { x: 306 - (companyName.length * 5), y: height - 400, size: 18, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(`Version 1.0 | ${today}`, { x: 230, y: height - 430, size: 12, font: helvetica, color: rgb(0.6, 0.6, 0.6) });

    // Page 2: Brand Overview
    page = pdfDoc.addPage([612, 792]);
    height = page.getSize().height;
    let y = height - 50;

    page.drawText("Brand Overview", { x: 50, y, size: 24, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
    y -= 40;

    page.drawText("About Us:", { x: 50, y, size: 12, font: helveticaBold });
    y -= 20;
    page.drawText(`${companyName} is a company in the ${industry} industry.`, { x: 50, y, size: 10, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
    y -= 30;

    page.drawText("What We Offer:", { x: 50, y, size: 12, font: helveticaBold });
    y -= 20;
    // Truncate products if too long
    const productText = products.length > 80 ? products.substring(0, 80) + "..." : products;
    page.drawText(productText, { x: 50, y, size: 10, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
    y -= 30;

    page.drawText("Mission Statement:", { x: 50, y, size: 12, font: helveticaBold });
    y -= 20;
    page.drawText("[Your mission statement here - what drives your company]", { x: 50, y, size: 10, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
    y -= 30;

    page.drawText("Vision:", { x: 50, y, size: 12, font: helveticaBold });
    y -= 20;
    page.drawText("[Your vision statement here - where you're headed]", { x: 50, y, size: 10, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
    y -= 30;

    page.drawText("Core Values:", { x: 50, y, size: 12, font: helveticaBold });
    y -= 20;
    page.drawText("• [Value 1] - [Brief description]", { x: 50, y, size: 10, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
    y -= 15;
    page.drawText("• [Value 2] - [Brief description]", { x: 50, y, size: 10, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
    y -= 15;
    page.drawText("• [Value 3] - [Brief description]", { x: 50, y, size: 10, font: helvetica, color: rgb(0.4, 0.4, 0.4) });

    // Page 3: Logo Usage
    page = pdfDoc.addPage([612, 792]);
    height = page.getSize().height;
    y = height - 50;

    page.drawText("Logo Usage", { x: 50, y, size: 24, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
    y -= 40;

    page.drawText("Primary Logo", { x: 50, y, size: 14, font: helveticaBold });
    y -= 20;
    page.drawText("[Insert primary logo here]", { x: 50, y, size: 10, font: helveticaOblique, color: rgb(0.6, 0.6, 0.6) });
    y -= 40;

    page.drawText("Clear Space Requirements:", { x: 50, y, size: 12, font: helveticaBold });
    y -= 20;
    page.drawText("Maintain minimum clear space equal to the height of the logo mark around all sides.", { x: 50, y, size: 10, font: helvetica });
    y -= 30;

    page.drawText("Minimum Size:", { x: 50, y, size: 12, font: helveticaBold });
    y -= 20;
    page.drawText("Digital: 100px width minimum  |  Print: 1 inch width minimum", { x: 50, y, size: 10, font: helvetica });
    y -= 40;

    page.drawText("Do:", { x: 50, y, size: 12, font: helveticaBold, color: rgb(0, 0.5, 0) });
    y -= 18;
    page.drawText("• Use approved logo files only", { x: 50, y, size: 10, font: helvetica });
    y -= 15;
    page.drawText("• Maintain proper clear space", { x: 50, y, size: 10, font: helvetica });
    y -= 15;
    page.drawText("• Use on approved background colors", { x: 50, y, size: 10, font: helvetica });
    y -= 30;

    page.drawText("Don't:", { x: 50, y, size: 12, font: helveticaBold, color: rgb(0.8, 0, 0) });
    y -= 18;
    page.drawText("• Stretch or distort the logo", { x: 50, y, size: 10, font: helvetica });
    y -= 15;
    page.drawText("• Change logo colors arbitrarily", { x: 50, y, size: 10, font: helvetica });
    y -= 15;
    page.drawText("• Add effects like shadows or gradients", { x: 50, y, size: 10, font: helvetica });

    // Page 4: Color Palette
    page = pdfDoc.addPage([612, 792]);
    height = page.getSize().height;
    y = height - 50;

    page.drawText("Color Palette", { x: 50, y, size: 24, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
    y -= 40;

    page.drawText("Primary Colors", { x: 50, y, size: 14, font: helveticaBold });
    y -= 30;

    // Color swatches
    page.drawRectangle({ x: 50, y: y - 50, width: 80, height: 80, color: rgb(0.2, 0.2, 0.2) });
    page.drawText("Dark Gray", { x: 50, y: y - 70, size: 10, font: helveticaBold });
    page.drawText("#333333", { x: 50, y: y - 85, size: 9, font: helvetica, color: rgb(0.5, 0.5, 0.5) });

    page.drawRectangle({ x: 160, y: y - 50, width: 80, height: 80, color: rgb(0.4, 0.4, 0.4) });
    page.drawText("Medium Gray", { x: 160, y: y - 70, size: 10, font: helveticaBold });
    page.drawText("#666666", { x: 160, y: y - 85, size: 9, font: helvetica, color: rgb(0.5, 0.5, 0.5) });

    page.drawRectangle({ x: 270, y: y - 50, width: 80, height: 80, borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 1, color: rgb(1, 1, 1) });
    page.drawText("White", { x: 270, y: y - 70, size: 10, font: helveticaBold });
    page.drawText("#FFFFFF", { x: 270, y: y - 85, size: 9, font: helvetica, color: rgb(0.5, 0.5, 0.5) });

    y -= 130;
    page.drawText("Accent Colors", { x: 50, y, size: 14, font: helveticaBold });
    y -= 20;
    page.drawText("[Add your brand accent colors here with hex codes]", { x: 50, y, size: 10, font: helveticaOblique, color: rgb(0.6, 0.6, 0.6) });

    // Page 5: Typography
    page = pdfDoc.addPage([612, 792]);
    height = page.getSize().height;
    y = height - 50;

    page.drawText("Typography", { x: 50, y, size: 24, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
    y -= 40;

    page.drawText("Headlines", { x: 50, y, size: 14, font: helveticaBold });
    y -= 20;
    page.drawText("Font: [Your headline font family]", { x: 50, y, size: 10, font: helvetica });
    y -= 15;
    page.drawText("Weights: Bold, Semi-Bold", { x: 50, y, size: 10, font: helvetica });
    y -= 15;
    page.drawText("Sizes: H1 = 48px, H2 = 36px, H3 = 24px, H4 = 18px", { x: 50, y, size: 10, font: helvetica });
    y -= 30;

    page.drawText("Body Text", { x: 50, y, size: 14, font: helveticaBold });
    y -= 20;
    page.drawText("Font: [Your body font family]", { x: 50, y, size: 10, font: helvetica });
    y -= 15;
    page.drawText("Weights: Regular, Medium", { x: 50, y, size: 10, font: helvetica });
    y -= 15;
    page.drawText("Sizes: 14-16px for web, 10-12pt for print", { x: 50, y, size: 10, font: helvetica });
    y -= 15;
    page.drawText("Line Height: 1.5 for optimal readability", { x: 50, y, size: 10, font: helvetica });

    // Page 6: Voice & Tone
    page = pdfDoc.addPage([612, 792]);
    height = page.getSize().height;
    y = height - 50;

    page.drawText("Voice & Tone", { x: 50, y, size: 24, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
    y -= 40;

    page.drawText("Our brand voice is:", { x: 50, y, size: 12, font: helveticaBold });
    y -= 25;

    const voiceTraits = [
        ["Professional", "We communicate with expertise and credibility"],
        ["Approachable", "We're friendly and easy to understand"],
        ["Confident", "We speak with authority without being arrogant"],
        ["Helpful", "We focus on solving problems and adding value"],
    ];

    for (const [trait, desc] of voiceTraits) {
        page.drawText(`• ${trait}`, { x: 50, y, size: 11, font: helveticaBold });
        y -= 18;
        page.drawText(desc, { x: 70, y, size: 10, font: helvetica, color: rgb(0.4, 0.4, 0.4) });
        y -= 25;
    }

    const pdfBytes = await pdfDoc.save();

    return {
        buffer: Buffer.from(pdfBytes),
        contentType: "application/pdf",
        filename: "brand-guidelines.pdf",
    };
}