// src/config/advisor-page-content.ts
// Extended content for individual advisor pages on the website
// Used by /about/[advisor] dynamic route pages
// Links map to LinkedIn Showcase Pages

import type { AgentType } from "@/config/agent-config";

export interface AdvisorPageContent {
    id: AgentType;
    slug: string;
    linkedinShowcase: string;
    metaTitle: string;
    metaDescription: string;
    heroTagline: string;
    heroDescription: string;
    capabilities: {
        title: string;
        description: string;
    }[];
    useCases: string[];
    sampleQuestions: string[];
    ctaText: string;
}

export const advisorPageContent: Record<string, AdvisorPageContent> = {
    "technology-partner": {
        id: "technology",
        slug: "technology-partner",
        linkedinShowcase: "https://linkedin.com/showcase/ceo-sidekick-technology-partner",
        metaTitle: "AI Technology Partner | CEO Sidekick",
        metaDescription:
            "Get on-demand technical strategy, architecture reviews, and infrastructure guidance from an AI-powered Technology Partner. Built for founders and SMBs.",
        heroTagline: "Your fractional CTO — without the six-figure salary.",
        heroDescription:
            "The Technology Partner provides expert-level architecture, infrastructure, and technical strategy guidance for founders and SMB leaders who need a CTO's perspective — on demand, 24/7.",
        capabilities: [
            {
                title: "Architecture & System Design",
                description:
                    "Get guidance on designing scalable, maintainable systems. Evaluate monolith vs. microservices, choose the right databases, and plan for growth.",
            },
            {
                title: "Cloud & Infrastructure",
                description:
                    "Navigate AWS, GCP, Azure decisions. Plan cloud migrations, optimize costs, and build infrastructure that scales with your business.",
            },
            {
                title: "Technical Strategy",
                description:
                    "Make informed build vs. buy decisions, evaluate vendors, plan your product roadmap, and prioritize your engineering backlog.",
            },
            {
                title: "Security & Compliance",
                description:
                    "Understand security best practices, plan for SOC 2 compliance, protect customer data, and build security into your architecture from day one.",
            },
        ],
        useCases: [
            "Evaluating whether to build custom software or buy an existing solution",
            "Planning a cloud migration from on-premise infrastructure",
            "Choosing the right tech stack for a new product",
            "Preparing for a technical due diligence review before fundraising",
            "Building your first engineering team and defining roles",
        ],
        sampleQuestions: [
            "Should I use a monolithic or microservices architecture for my SaaS MVP?",
            "How do I evaluate cloud providers for my e-commerce platform?",
            "What security measures should I prioritize before launching?",
            "Help me create a technical roadmap for the next 12 months.",
        ],
        ctaText: "Get technical guidance now",
    },

    "executive-coach": {
        id: "coach",
        slug: "executive-coach",
        linkedinShowcase: "https://linkedin.com/showcase/ceo-sidekick-executive-coach",
        metaTitle: "AI Executive Coach | CEO Sidekick",
        metaDescription:
            "Develop your leadership with an AI Executive Coach. Decision frameworks, founder growth, and confidential coaching for entrepreneurs — available 24/7.",
        heroTagline: "Sharpen your leadership — on your schedule, at your pace.",
        heroDescription:
            "The Executive Coach provides confidential, always-available leadership development for founders and business leaders navigating the challenges of growth.",
        capabilities: [
            {
                title: "Decision Frameworks",
                description:
                    "Navigate high-stakes decisions with proven frameworks. Pressure-test your thinking, weigh trade-offs, and move forward with confidence.",
            },
            {
                title: "Leadership Development",
                description:
                    "Develop the skills that separate good founders from great ones — communication, delegation, strategic thinking, and executive presence.",
            },
            {
                title: "Difficult Conversations",
                description:
                    "Prepare for tough conversations with co-founders, employees, investors, or partners. Practice and refine your approach.",
            },
            {
                title: "Team & Culture Building",
                description:
                    "Build high-performing teams, set expectations, create accountability systems, and shape your company culture intentionally.",
            },
        ],
        useCases: [
            "Preparing for a difficult conversation with a co-founder",
            "Deciding whether to pivot your business model",
            "Building your leadership skills as a first-time CEO",
            "Managing burnout and maintaining peak performance",
            "Structuring your first board meeting",
        ],
        sampleQuestions: [
            "How do I have a constructive conversation with my co-founder about equity?",
            "What framework should I use to decide if we should pivot?",
            "I'm struggling to delegate — how do I let go of control?",
            "How do I build executive presence when I'm the youngest person in the room?",
        ],
        ctaText: "Start your coaching session",
    },

    "hr-partner": {
        id: "hr",
        slug: "hr-partner",
        linkedinShowcase: "https://linkedin.com/showcase/ceo-sidekick-hr-partner",
        metaTitle: "AI HR Partner | CEO Sidekick",
        metaDescription:
            "Navigate hiring, culture, compliance, and people strategy with an AI HR Partner. Built for founders scaling their teams without an HR department.",
        heroTagline: "Build the team your business deserves — without an HR department.",
        heroDescription:
            "The HR Partner helps founders and small business leaders navigate hiring, culture-building, compliance, and people management — from first hire to scaling team.",
        capabilities: [
            {
                title: "Hiring & Recruitment",
                description:
                    "Write compelling job descriptions, structure effective interviews, evaluate candidates, and build a hiring process that finds the right people.",
            },
            {
                title: "Compliance & Employment Law",
                description:
                    "Navigate employment regulations, understand your obligations, set up proper documentation, and stay compliant as you grow.",
            },
            {
                title: "Performance Management",
                description:
                    "Create performance review systems, handle difficult performance conversations, build improvement plans, and set clear expectations.",
            },
            {
                title: "Culture & Engagement",
                description:
                    "Build company culture intentionally, improve employee engagement, design onboarding experiences, and create a workplace people love.",
            },
        ],
        useCases: [
            "Writing your first job description and planning the interview process",
            "Handling a performance issue with an underperforming employee",
            "Setting up an employee handbook and basic HR policies",
            "Designing a compensation and benefits strategy on a startup budget",
            "Building an onboarding program for new hires",
        ],
        sampleQuestions: [
            "Help me write a job description for a senior full-stack developer.",
            "What should I include in my employee handbook?",
            "How do I structure a performance improvement plan?",
            "What are the employment law basics I need to know in Texas?",
        ],
        ctaText: "Get HR guidance now",
    },

    "legal-advisor": {
        id: "legal",
        slug: "legal-advisor",
        linkedinShowcase: "https://linkedin.com/showcase/ceo-sidekick-legal-advisor",
        metaTitle: "AI Legal Advisor | CEO Sidekick",
        metaDescription:
            "Get accessible legal guidance on contracts, IP, compliance, and business law. AI-powered Legal Advisor for founders — understand your options before calling a lawyer.",
        heroTagline: "Navigate business law confidently — without billable hours.",
        heroDescription:
            "The Legal Advisor helps you understand your legal landscape and make informed decisions on contracts, IP, compliance, and business formation — without the $400/hour price tag.",
        capabilities: [
            {
                title: "Contract Review & Guidance",
                description:
                    "Understand contract terms, identify potential issues, and know the right questions to ask before signing. Get oriented on common business agreements.",
            },
            {
                title: "Intellectual Property",
                description:
                    "Understand how to protect your brand, ideas, and creations through trademarks, copyrights, patents, and trade secrets.",
            },
            {
                title: "Business Formation",
                description:
                    "Navigate entity selection, operating agreements, partnership structures, and the legal foundations of your business.",
            },
            {
                title: "Regulatory Compliance",
                description:
                    "Understand industry-specific regulations, privacy requirements (GDPR, CCPA), and compliance obligations for your business.",
            },
        ],
        useCases: [
            "Understanding a vendor contract before signing",
            "Figuring out whether to trademark your business name",
            "Choosing between LLC, S-Corp, and C-Corp structures",
            "Understanding privacy law requirements for your SaaS product",
            "Reviewing a partnership or operating agreement",
        ],
        sampleQuestions: [
            "What should I look for in a SaaS vendor agreement?",
            "Do I need a trademark, copyright, or patent for my product?",
            "What's the difference between an LLC and an S-Corp for my business?",
            "What privacy regulations apply to my app that collects user data?",
        ],
        ctaText: "Get legal guidance now",
    },

    "marketing-partner": {
        id: "marketing",
        slug: "marketing-partner",
        linkedinShowcase: "https://linkedin.com/showcase/ceo-sidekick-marketing-partner",
        metaTitle: "AI Marketing Partner | CEO Sidekick",
        metaDescription:
            "Develop winning marketing strategies with an AI Marketing Partner. Brand positioning, growth marketing, campaigns, and channel strategy for founders and SMBs.",
        heroTagline: "Build a marketing engine — without a marketing team.",
        heroDescription:
            "The Marketing Partner helps you develop and execute marketing strategies that drive real growth — from brand positioning and messaging to campaign planning and channel strategy.",
        capabilities: [
            {
                title: "Brand Strategy & Positioning",
                description:
                    "Define your brand, nail your positioning, craft compelling messaging, and differentiate from competitors in a crowded market.",
            },
            {
                title: "Growth & Demand Generation",
                description:
                    "Build lead generation systems, optimize conversion funnels, plan campaigns, and create sustainable growth engines.",
            },
            {
                title: "Content & SEO Strategy",
                description:
                    "Develop content strategies that drive organic traffic, improve search rankings, and establish thought leadership in your space.",
            },
            {
                title: "Channel Strategy & Analytics",
                description:
                    "Choose the right marketing channels for your audience, plan budgets, and measure what matters — not vanity metrics.",
            },
        ],
        useCases: [
            "Developing your brand positioning and messaging framework",
            "Planning a product launch marketing campaign",
            "Building an SEO strategy from scratch",
            "Figuring out which marketing channels to invest in first",
            "Creating a marketing plan on a bootstrapped budget",
        ],
        sampleQuestions: [
            "Help me develop a positioning statement for my B2B SaaS product.",
            "What marketing channels should I prioritize with a $2K/month budget?",
            "How do I create a content calendar that drives organic traffic?",
            "What metrics should I track to measure marketing effectiveness?",
        ],
        ctaText: "Get marketing guidance now",
    },

    "sales-partner": {
        id: "sales",
        slug: "sales-partner",
        linkedinShowcase: "https://linkedin.com/showcase/ceo-sidekick-sales-partner",
        metaTitle: "AI Sales Partner | CEO Sidekick",
        metaDescription:
            "Build repeatable sales processes with an AI Sales Partner. Pipeline development, deal coaching, and revenue acceleration for founders and growing businesses.",
        heroTagline: "Close more deals — with a sales strategist in your pocket.",
        heroDescription:
            "The Sales Partner helps you build repeatable, scalable sales processes that turn prospects into customers and customers into revenue.",
        capabilities: [
            {
                title: "Sales Process & Playbooks",
                description:
                    "Build a structured sales process from first touch to close. Create playbooks your team can follow consistently.",
            },
            {
                title: "Deal Coaching & Objection Handling",
                description:
                    "Get tactical advice on active deals. Prepare for objections, refine your pitch, and develop strategies for specific opportunities.",
            },
            {
                title: "Pipeline & Forecasting",
                description:
                    "Build a healthy pipeline, set realistic forecasts, identify bottlenecks, and create predictable revenue.",
            },
            {
                title: "Proposals & Pricing",
                description:
                    "Craft winning proposals, develop pricing strategies, structure deals, and negotiate terms that work for both sides.",
            },
        ],
        useCases: [
            "Building your first sales process as a technical founder",
            "Preparing for a high-stakes pitch meeting",
            "Developing a pricing strategy for a new product",
            "Creating a sales playbook for your first sales hire",
            "Handling common objections in your sales cycle",
        ],
        sampleQuestions: [
            "Help me build a sales process for my B2B SaaS product.",
            "How should I price my consulting services?",
            "I have a big pitch next week — help me prepare.",
            "What's the best way to follow up after a demo without being pushy?",
        ],
        ctaText: "Get sales guidance now",
    },

    "content-engine": {
        id: "content",
        slug: "content-engine",
        linkedinShowcase: "https://linkedin.com/showcase/ceo-sidekick-content-engine",
        metaTitle: "AI Content Engine | CEO Sidekick",
        metaDescription:
            "Create professional content at scale with the AI Content Engine. Blog posts, social content, email campaigns, and thought leadership for busy founders.",
        heroTagline: "Publish like a media company — even as a team of one.",
        heroDescription:
            "The Content Engine helps you create professional, engaging content that builds authority and drives business growth — without a content team.",
        capabilities: [
            {
                title: "Blog & Long-Form Content",
                description:
                    "Create well-researched blog posts, articles, and guides that establish thought leadership and drive organic traffic.",
            },
            {
                title: "Social Media Content",
                description:
                    "Develop engaging LinkedIn posts, Twitter threads, and social content that builds your personal and company brand.",
            },
            {
                title: "Email Campaigns",
                description:
                    "Write email sequences for launches, nurture campaigns, newsletters, and customer communications that actually get opened.",
            },
            {
                title: "Content Strategy & Planning",
                description:
                    "Develop editorial calendars, content pillars, repurposing strategies, and measurement frameworks to maximize your content ROI.",
            },
        ],
        useCases: [
            "Writing a weekly LinkedIn post to build thought leadership",
            "Creating a product launch email sequence",
            "Developing a content calendar for the next quarter",
            "Repurposing a blog post into multiple social media formats",
            "Writing a company newsletter that people actually read",
        ],
        sampleQuestions: [
            "Write a LinkedIn post about the challenges of bootstrapping a startup.",
            "Help me create a 4-email welcome sequence for new users.",
            "What content pillars should I focus on for my SaaS blog?",
            "How do I repurpose one blog post into a week's worth of content?",
        ],
        ctaText: "Start creating content",
    },
};

export const advisorSlugs = Object.keys(advisorPageContent);

export function getAdvisorBySlug(slug: string): AdvisorPageContent | undefined {
    return advisorPageContent[slug];
}