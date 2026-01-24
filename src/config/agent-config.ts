// src/config/agent-config.ts
// Centralized agent configuration - Single source of truth for all agent data
// Used by: Dashboard, Chat, Landing Page, and AgentAvatar component

// ============================================
// AGENT TYPES
// Note: Knowledge Base is a feature, not a separate agent
// ============================================

export type AgentType =
    | "technology"
    | "coach"
    | "legal"
    | "hr"
    | "marketing"
    | "sales"
    | "content";

// ============================================
// AGENT CONFIGURATION INTERFACE
// ============================================

export interface AgentConfig {
    id: AgentType;
    name: string;
    subtitle: string;
    description: string;
    color: string;           // Tailwind bg class (e.g., "bg-accent-teal")
    lightColor: string;      // Tailwind light bg class for cards
    textColor: string;       // Tailwind text class
    hexColor: string;        // Hex color for custom styling
    avatarUrl: string;       // URL to agent avatar image
    capabilities: string[];  // List of agent capabilities
    example: string;         // Example prompt
    disclaimer?: string;     // Optional disclaimer text
    href: string;            // Navigation link
    external?: boolean;      // Whether link is external
}

// ============================================
// AVATAR URLS
// Replace these with your actual Midjourney-generated avatar URLs
// ============================================

const AVATAR_BASE_URL = "/images/avatars"; // Update this to your CDN or public folder path

export const AGENT_AVATARS: Record<AgentType, string> = {
    technology: `${AVATAR_BASE_URL}/technology-partner.png`,
    coach: `${AVATAR_BASE_URL}/executive-coach.png`,
    legal: `${AVATAR_BASE_URL}/legal-advisor.png`,
    hr: `${AVATAR_BASE_URL}/hr-partner.png`,
    marketing: `${AVATAR_BASE_URL}/marketing-partner.png`,
    sales: `${AVATAR_BASE_URL}/sales-partner.png`,
    content: `${AVATAR_BASE_URL}/content-engine.png`,
};

// ============================================
// AGENT COLORS
// ============================================

export const AGENT_COLORS: Record<AgentType, {
    bg: string;
    light: string;
    text: string;
    hex: string;
}> = {
    technology: {
        bg: "bg-accent-teal",
        light: "bg-accent-teal-light",
        text: "text-accent-teal",
        hex: "#00778B",
    },
    coach: {
        bg: "bg-agent-coach",
        light: "bg-purple-100",
        text: "text-agent-coach",
        hex: "#7C3AED",
    },
    legal: {
        bg: "bg-agent-legal",
        light: "bg-blue-100",
        text: "text-agent-legal",
        hex: "#2563EB",
    },
    hr: {
        bg: "bg-agent-hr",
        light: "bg-green-100",
        text: "text-agent-hr",
        hex: "#16A34A",
    },
    marketing: {
        bg: "bg-pink-600",
        light: "bg-pink-100",
        text: "text-pink-600",
        hex: "#DB2777",
    },
    sales: {
        bg: "bg-orange-600",
        light: "bg-orange-100",
        text: "text-orange-600",
        hex: "#EA580C",
    },
    content: {
        bg: "bg-primary-red",
        light: "bg-primary-red-light",
        text: "text-primary-red",
        hex: "#C8102E",
    },
};

// ============================================
// FULL AGENT CONFIGURATIONS
// ============================================

export const AGENTS: Record<AgentType, AgentConfig> = {
    technology: {
        id: "technology",
        name: "Technology Partner",
        subtitle: "Virtual CTO/CIO",
        description: "Technology and automation strategy advisor. Get guidance on tech stack decisions, digital transformation, and build vs. buy analysis.",
        color: AGENT_COLORS.technology.bg,
        lightColor: AGENT_COLORS.technology.light,
        textColor: AGENT_COLORS.technology.text,
        hexColor: AGENT_COLORS.technology.hex,
        avatarUrl: AGENT_AVATARS.technology,
        capabilities: [
            "Technology stack recommendations",
            "Digital transformation roadmaps",
            "Vendor evaluation & selection",
            "IT budget optimization",
            "Security & compliance guidance",
        ],
        example: '"Should I build a custom app or use off-the-shelf software?"',
        href: "/chat?agent=technology",
    },
    coach: {
        id: "coach",
        name: "Executive Coach",
        subtitle: "Leadership Partner",
        description: "Leadership development and strategic thinking partner. Prepare for difficult conversations, set OKRs, and develop as a leader.",
        color: AGENT_COLORS.coach.bg,
        lightColor: AGENT_COLORS.coach.light,
        textColor: AGENT_COLORS.coach.text,
        hexColor: AGENT_COLORS.coach.hex,
        avatarUrl: AGENT_AVATARS.coach,
        capabilities: [
            "Decision-making frameworks",
            "Leadership development",
            "Difficult conversation prep",
            "Goal setting (OKRs/KPIs)",
            "Work-life balance coaching",
        ],
        example: '"Help me prepare for a difficult conversation with an underperforming employee"',
        href: "/chat?agent=coach",
    },
    legal: {
        id: "legal",
        name: "Legal Advisor",
        subtitle: "Contract & Compliance",
        description: "General legal guidance and document review. Get contract red flags identified and understand business structure options.",
        color: AGENT_COLORS.legal.bg,
        lightColor: AGENT_COLORS.legal.light,
        textColor: AGENT_COLORS.legal.text,
        hexColor: AGENT_COLORS.legal.hex,
        avatarUrl: AGENT_AVATARS.legal,
        capabilities: [
            "Contract review & red flags",
            "Terms of service guidance",
            "Business structure advice",
            "IP protection overview",
            "Compliance checklists",
        ],
        example: '"Review this freelancer contract for red flags"',
        disclaimer: "Not a substitute for licensed legal counsel",
        href: "/chat?agent=legal",
    },
    hr: {
        id: "hr",
        name: "HR Partner",
        subtitle: "People Operations",
        description: "Human resources guidance and documentation. Create job descriptions, develop interview questions, and build HR processes.",
        color: AGENT_COLORS.hr.bg,
        lightColor: AGENT_COLORS.hr.light,
        textColor: AGENT_COLORS.hr.text,
        hexColor: AGENT_COLORS.hr.hex,
        avatarUrl: AGENT_AVATARS.hr,
        capabilities: [
            "Job description creation",
            "Interview question development",
            "Performance review frameworks",
            "Onboarding checklists",
            "Employee handbook guidance",
        ],
        example: '"Help me write a job description for a marketing manager"',
        href: "/chat?agent=hr",
    },
    marketing: {
        id: "marketing",
        name: "Marketing Partner",
        subtitle: "Growth & Brand",
        description: "Marketing strategy and brand development advisor. Plan campaigns, develop positioning, and optimize your marketing spend.",
        color: AGENT_COLORS.marketing.bg,
        lightColor: AGENT_COLORS.marketing.light,
        textColor: AGENT_COLORS.marketing.text,
        hexColor: AGENT_COLORS.marketing.hex,
        avatarUrl: AGENT_AVATARS.marketing,
        capabilities: [
            "Marketing strategy development",
            "Brand positioning & messaging",
            "Digital marketing campaigns",
            "Content marketing planning",
            "Marketing analytics & ROI",
        ],
        example: '"What marketing channels should I focus on with a $5K monthly budget?"',
        href: "/chat?agent=marketing",
    },
    sales: {
        id: "sales",
        name: "Sales Partner",
        subtitle: "Revenue & Deals",
        description: "Sales strategy and deal-closing advisor. Build your sales process, handle objections, and improve your close rate.",
        color: AGENT_COLORS.sales.bg,
        lightColor: AGENT_COLORS.sales.light,
        textColor: AGENT_COLORS.sales.text,
        hexColor: AGENT_COLORS.sales.hex,
        avatarUrl: AGENT_AVATARS.sales,
        capabilities: [
            "Sales process development",
            "Pipeline management",
            "Objection handling scripts",
            "Proposal & pricing strategy",
            "Sales team coaching",
        ],
        example: '"How do I handle when prospects say we\'re too expensive?"',
        href: "/chat?agent=sales",
    },
    content: {
        id: "content",
        name: "Content Engine",
        subtitle: "Thought Leadership",
        description: "AI-powered content generation for marketing and thought leadership. Create blog posts, social media, and marketing copy.",
        color: AGENT_COLORS.content.bg,
        lightColor: AGENT_COLORS.content.light,
        textColor: AGENT_COLORS.content.text,
        hexColor: AGENT_COLORS.content.hex,
        avatarUrl: AGENT_AVATARS.content,
        capabilities: [
            "Blog post generation",
            "Social media content",
            "Marketing copy",
            "Email campaigns",
            "Thought leadership pieces",
        ],
        example: '"Write a LinkedIn post about AI trends in my industry"',
        href: "/chat?agent=content",
        external: true,
    },
};

// ============================================
// SUGGESTED PROMPTS BY AGENT
// ============================================

export const SUGGESTED_PROMPTS: Record<AgentType, string[]> = {
    technology: [
        "Should I build a custom solution or buy an existing tool for my CRM needs?",
        "What tech stack would you recommend for a SaaS startup?",
        "Help me evaluate cloud providers for my business",
        "What should I prioritize in my technology roadmap this quarter?",
    ],
    coach: [
        "How do I prepare for a difficult conversation with an underperforming employee?",
        "Help me set better OKRs for my team",
        "What frameworks can help me make better strategic decisions?",
    ],
    legal: [
        "What should I include in my terms of service?",
        "Review this contract for potential issues",
        "What privacy policy requirements apply to my business?",
    ],
    hr: [
        "Help me write a job description for a senior developer",
        "What questions should I ask in a technical interview?",
        "How do I structure a performance review?",
    ],
    marketing: [
        "What marketing channels should I focus on with a $5K monthly budget?",
        "Help me develop a brand positioning statement",
        "How do I measure marketing ROI effectively?",
    ],
    sales: [
        "How do I handle when prospects say we're too expensive?",
        "Help me build a sales process from scratch",
        "What should I include in a winning proposal?",
    ],
    content: [
        "Write a blog post about...",
        "Create social media posts for my product launch",
        "Help me craft an email newsletter",
    ],
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get agent configuration by ID
 */
export function getAgent(agentId: AgentType): AgentConfig {
    return AGENTS[agentId];
}

/**
 * Get agent avatar URL by ID
 */
export function getAgentAvatar(agentId: AgentType): string {
    return AGENT_AVATARS[agentId];
}

/**
 * Get agent colors by ID
 */
export function getAgentColors(agentId: AgentType) {
    return AGENT_COLORS[agentId];
}

/**
 * Get suggested prompts for an agent
 */
export function getAgentPrompts(agentId: AgentType): string[] {
    return SUGGESTED_PROMPTS[agentId];
}

/**
 * Get all agents as an array (useful for mapping)
 */
export function getAllAgents(): AgentConfig[] {
    return Object.values(AGENTS);
}

/**
 * Get all agent IDs
 */
export function getAllAgentIds(): AgentType[] {
    return Object.keys(AGENTS) as AgentType[];
}