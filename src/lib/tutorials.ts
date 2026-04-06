// src/lib/tutorials.ts
// Tutorial metadata for the public tutorials page.
// YouTube IDs are null until videos are generated, uploaded, and linked.

// ============================================
// Types
// ============================================

export interface Tutorial {
    id: string;
    title: string;
    description: string;
    category: string;
    durationSeconds: number;
    youtubeId: string | null;
}

export interface TutorialCategory {
    id: string;
    title: string;
    description: string;
    iconName: string; // lucide icon name — resolved on client side
}

// ============================================
// Categories
// ============================================

export const TUTORIAL_CATEGORIES: TutorialCategory[] = [
    {
        id: "getting-started",
        title: "Getting Started",
        description: "Set up your account and personalize your experience",
        iconName: "rocket",
    },
    {
        id: "ai-advisors",
        title: "AI Advisors",
        description: "Get expert guidance from your virtual advisory board",
        iconName: "message-square",
    },
    {
        id: "content-engine",
        title: "Content Engine",
        description: "Create professional content at scale",
        iconName: "pen-tool",
    },
    {
        id: "linkedin",
        title: "LinkedIn Integration",
        description: "Connect, publish, and schedule LinkedIn content",
        iconName: "linkedin",
    },
    {
        id: "knowledge-docs",
        title: "Knowledge & Documents",
        description: "Build your company knowledge base and use templates",
        iconName: "book-open",
    },
    {
        id: "goals-billing",
        title: "Goals & Billing",
        description: "Track goals and manage your subscription",
        iconName: "target",
    },
];

// ============================================
// Tutorials
// ============================================

export const TUTORIALS: Tutorial[] = [
    // --- Getting Started ---
    {
        id: "onboarding",
        title: "Platform Overview & Onboarding",
        description:
            "A complete walkthrough of CEO Sidekick — from account creation through the onboarding wizard to your personalized dashboard.",
        category: "getting-started",
        durationSeconds: 90,
        youtubeId: null,
    },
    {
        id: "settings-personalization",
        title: "Settings & Personalization",
        description:
            "Set up your company profile, AI preferences, and communication style to get more relevant, tailored advice from every advisor.",
        category: "getting-started",
        durationSeconds: 85,
        youtubeId: null,
    },

    // --- AI Advisors ---
    {
        id: "advisor-chat",
        title: "Using AI Advisors",
        description:
            "Learn how to chat with your AI advisory board — switch between advisors, ask follow-up questions, and save insights to your knowledge base.",
        category: "ai-advisors",
        durationSeconds: 95,
        youtubeId: null,
    },
    {
        id: "roundtable",
        title: "Round Table Multi-Advisor",
        description:
            "Get perspectives from multiple AI advisors on a single question, with an AI-synthesized recommendation combining all viewpoints.",
        category: "ai-advisors",
        durationSeconds: 96,
        youtubeId: null,
    },

    // --- Content Engine ---
    {
        id: "content-engine",
        title: "Content Engine Overview",
        description:
            "Explore the Content Engine dashboard — images, LinkedIn articles, posts, and web blogs all in one place with stats and quick navigation.",
        category: "content-engine",
        durationSeconds: 92,
        youtubeId: null,
    },
    {
        id: "linkedin-posts",
        title: "Creating LinkedIn Posts",
        description:
            "Generate AI-powered LinkedIn posts with customizable tone, post type, and writer profile. Edit, preview, and save as drafts.",
        category: "content-engine",
        durationSeconds: 80,
        youtubeId: null,
    },
    {
        id: "bulk-create-posts",
        title: "Bulk Create Posts",
        description:
            "Generate up to 20 research-driven LinkedIn posts at once. Review, edit, regenerate individual posts, and batch-schedule them all.",
        category: "content-engine",
        durationSeconds: 85,
        youtubeId: null,
    },
    {
        id: "content-campaigns",
        title: "Content Campaigns",
        description:
            "Create a full content campaign from a single brief — generate a hero image, LinkedIn article, post, and web blog all at once.",
        category: "content-engine",
        durationSeconds: 80,
        youtubeId: null,
    },

    // --- LinkedIn Integration ---
    {
        id: "linkedin-integration",
        title: "Connecting LinkedIn Accounts",
        description:
            "Connect your personal LinkedIn profile and organization pages to publish and schedule content directly from CEO Sidekick.",
        category: "linkedin",
        durationSeconds: 75,
        youtubeId: null,
    },
    {
        id: "scheduling-publishing",
        title: "Scheduling & Publishing Posts",
        description:
            "Schedule posts for optimal engagement times, choose between personal and company pages, and track published content.",
        category: "linkedin",
        durationSeconds: 80,
        youtubeId: null,
    },

    // --- Knowledge & Documents ---
    {
        id: "company-library",
        title: "Company Library & Knowledge Base",
        description:
            "Upload company documents, build a searchable knowledge base, and get AI-powered answers with source citations from your own files.",
        category: "knowledge-docs",
        durationSeconds: 90,
        youtubeId: null,
    },
    {
        id: "documents",
        title: "Document Templates",
        description:
            "Browse and use pre-built document templates for business plans, proposals, contracts, and more — customized with your company context.",
        category: "knowledge-docs",
        durationSeconds: 87,
        youtubeId: null,
    },

    // --- Goals & Billing ---
    {
        id: "goals",
        title: "Goals & Tracking",
        description:
            "Set business goals with AI-generated action plans, track progress with step-by-step checklists, and stay accountable with target dates.",
        category: "goals-billing",
        durationSeconds: 94,
        youtubeId: null,
    },
    {
        id: "billing-credits",
        title: "Billing & Credits",
        description:
            "Understand how credits work, view your usage, upgrade plans, and purchase additional credit packs when you need them.",
        category: "goals-billing",
        durationSeconds: 70,
        youtubeId: null,
    },
];

// ============================================
// Helpers
// ============================================

/**
 * Get tutorials grouped by category
 */
export function getTutorialsByCategory(): Array<{
    category: TutorialCategory;
    tutorials: Tutorial[];
}> {
    return TUTORIAL_CATEGORIES.map((category) => ({
        category,
        tutorials: TUTORIALS.filter((t) => t.category === category.id),
    }));
}

/**
 * Format seconds as "Xm Ys"
 */
export function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    if (s === 0) return `${m}m`;
    return `${m}m ${s}s`;
}
