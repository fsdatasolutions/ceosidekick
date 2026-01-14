// Agent Configuration Exports
export { technologyPartnerConfig } from "./technology-partner";
export { executiveCoachConfig } from "./executive-coach";
export { legalAdvisorConfig } from "./legal-advisor";
export { hrPartnerConfig } from "./hr-partner";
export { marketingPartnerConfig } from "./marketing-partner";
export { salesPartnerConfig } from "./sales-partner";
export { knowledgeBaseConfig } from "./knowledge-base";
export { contentEngineConfig } from "./content-engine";

// Types
export * from "./types";

// Graph
export { runConversation, streamConversation, agentConfigs } from "./graph";

// Agent UI Configuration
import { AgentType, AgentUIConfig } from "./types";
import {
    Cpu,
    Target,
    Scale,
    Users,
    BookOpen,
    PenTool,
    TrendingUp,
    DollarSign,
} from "lucide-react";

export const agentUIConfigs: Record<AgentType, AgentUIConfig> = {
    technology: {
        id: "technology",
        name: "Technology Partner",
        subtitle: "Virtual CTO/CIO",
        description: "Technology strategy, digital transformation, and build vs. buy decisions",
        color: "bg-accent-teal",
        lightColor: "bg-accent-teal-light",
        textColor: "text-accent-teal",
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
        description: "Leadership development, decision-making frameworks, and strategic thinking",
        color: "bg-agent-coach",
        lightColor: "bg-purple-100",
        textColor: "text-agent-coach",
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
        description: "Contract review, terms of service, and business compliance guidance",
        color: "bg-agent-legal",
        lightColor: "bg-blue-100",
        textColor: "text-agent-legal",
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
        description: "Job descriptions, hiring processes, and HR policy development",
        color: "bg-agent-hr",
        lightColor: "bg-green-100",
        textColor: "text-agent-hr",
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
        subtitle: "Growth & Brand Strategy",
        description: "Marketing strategy, brand development, and campaign planning",
        color: "bg-pink-600",
        lightColor: "bg-pink-100",
        textColor: "text-pink-600",
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
        description: "Sales strategy, pipeline management, and closing techniques",
        color: "bg-orange-600",
        lightColor: "bg-orange-100",
        textColor: "text-orange-600",
        capabilities: [
            "Sales process development",
            "Pipeline management",
            "Objection handling",
            "Proposal & pricing strategy",
            "Sales team coaching",
        ],
        example: '"How do I handle when prospects say we\'re too expensive?"',
        href: "/chat?agent=sales",
    },
    knowledge: {
        id: "knowledge",
        name: "Knowledge Base",
        subtitle: "Company AI",
        description: "Q&A powered by your uploaded documents and company knowledge",
        color: "bg-agent-knowledge",
        lightColor: "bg-indigo-100",
        textColor: "text-agent-knowledge",
        capabilities: [
            "Document upload & indexing",
            "Semantic search across docs",
            "Q&A with source citations",
            "Meeting notes summarization",
            "New employee onboarding",
        ],
        example: '"What was decided in last month\'s strategy meeting?"',
        href: "/chat?agent=knowledge",
    },
    content: {
        id: "content",
        name: "Content Engine",
        subtitle: "Thought Leadership",
        description: "Blog posts, social media, marketing copy, and thought leadership content",
        color: "bg-primary-red",
        lightColor: "bg-primary-red-light",
        textColor: "text-primary-red",
        capabilities: [
            "Blog post generation",
            "Social media content",
            "Marketing copy",
            "Email campaigns",
            "Thought leadership pieces",
        ],
        example: '"Write a LinkedIn post about AI trends in my industry"',
        href: "/chat?agent=content",
    },
};

// Icon mapping for agents
export const agentIcons: Record<AgentType, typeof Cpu> = {
    technology: Cpu,
    coach: Target,
    legal: Scale,
    hr: Users,
    marketing: TrendingUp,
    sales: DollarSign,
    knowledge: BookOpen,
    content: PenTool,
};

// Agent order for UI display
export const agentOrder: AgentType[] = [
    "technology",
    "coach",
    "legal",
    "hr",
    "marketing",
    "sales",
    "knowledge",
    "content",
];