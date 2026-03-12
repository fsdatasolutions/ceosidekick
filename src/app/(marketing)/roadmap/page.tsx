// src/app/(marketing)/roadmap/page.tsx
import { Metadata } from "next";
import Link from "next/link";
import {
    Smartphone,
    FileText,
    Users,
    Building2,
    Globe,
    Zap,
    CheckCircle2,
    Clock,
    Circle,
} from "lucide-react";

export const metadata: Metadata = {
    title: "Roadmap | CEO Sidekick",
    description:
        "See what's coming next for CEO Sidekick — our product roadmap for 2025–2027.",
};

type Status = "shipped" | "in-progress" | "planned";

interface RoadmapItem {
    title: string;
    description: string;
    status: Status;
    icon: React.ElementType;
}

interface RoadmapPhase {
    year: string;
    theme: string;
    tagline: string;
    items: RoadmapItem[];
}

const statusConfig: Record<Status, { label: string; icon: React.ElementType; color: string }> = {
    shipped: { label: "Shipped", icon: CheckCircle2, color: "text-green-500 bg-green-50 border-green-200" },
    "in-progress": { label: "In Progress", icon: Clock, color: "text-amber-500 bg-amber-50 border-amber-200" },
    planned: { label: "Planned", icon: Circle, color: "text-neutral-400 bg-neutral-50 border-neutral-200" },
};

const roadmap: RoadmapPhase[] = [
    {
        year: "2025",
        theme: "Foundation",
        tagline: "Core platform and key features",
        items: [
            {
                title: "7 AI Advisors",
                description:
                    "Chat with specialized advisors across technology, strategy, legal, HR, marketing, sales, and content.",
                status: "shipped",
                icon: Users,
            },
            {
                title: "Company Library",
                description:
                    "Upload your business documents and get AI-powered answers grounded in your own data.",
                status: "shipped",
                icon: FileText,
            },
            {
                title: "Round Table",
                description:
                    "Multi-advisor boardroom where you get synthesized perspectives from multiple AI advisors simultaneously.",
                status: "shipped",
                icon: Users,
            },
            {
                title: "Business Document Templates",
                description:
                    "Generate professional business documents tailored to your company context.",
                status: "shipped",
                icon: FileText,
            },
            {
                title: "Mobile Experience",
                description:
                    "Responsive mobile interface so you can access your advisors on the go.",
                status: "in-progress",
                icon: Smartphone,
            },
            {
                title: "Enhanced Company Library",
                description:
                    "PDF and DOCX support, larger file uploads, and smarter document search.",
                status: "in-progress",
                icon: FileText,
            },
        ],
    },
    {
        year: "2026",
        theme: "Expansion",
        tagline: "Deeper insights and team collaboration",
        items: [
            {
                title: "Team Collaboration",
                description:
                    "Shared workspaces, team knowledge bases, and collaborative advisory sessions.",
                status: "planned",
                icon: Users,
            },
            {
                title: "Industry Verticals",
                description:
                    "Specialized advisor configurations for healthcare, SaaS, retail, and more.",
                status: "planned",
                icon: Building2,
            },
            {
                title: "Business Data Insights",
                description:
                    "Connect your business data and ask questions in natural language.",
                status: "planned",
                icon: Zap,
            },
        ],
    },
    {
        year: "2027",
        theme: "Scale",
        tagline: "Enterprise features and global reach",
        items: [
            {
                title: "Enterprise Features",
                description:
                    "SSO, audit logs, advanced permissions, and dedicated support for larger organizations.",
                status: "planned",
                icon: Building2,
            },
            {
                title: "International Expansion",
                description:
                    "Multi-language support and region-specific advisory knowledge.",
                status: "planned",
                icon: Globe,
            },
            {
                title: "AI Automation",
                description:
                    "Proactive insights, automated workflows, and scheduled advisory reports.",
                status: "planned",
                icon: Zap,
            },
        ],
    },
];

export default function RoadmapPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header */}
            <div className="pt-32 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="inline-block text-xs font-semibold tracking-wider uppercase text-primary-red mb-4">
            Product Roadmap
        </span>
                    <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 mb-6">
                        Where we&apos;re headed
                    </h1>
                    <p className="text-lg sm:text-xl text-neutral-500 max-w-2xl mx-auto leading-relaxed">
                        Our vision for building the most comprehensive AI-powered toolkit
                        for entrepreneurs and growing businesses.
                    </p>
                </div>
            </div>

            {/* Roadmap Timeline */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="space-y-16">
                    {roadmap.map((phase) => (
                        <section key={phase.year}>
                            {/* Phase Header */}
                            <div className="flex items-center gap-4 mb-8">
                                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-neutral-950 text-white flex items-center justify-center font-display font-bold text-lg">
                                    {phase.year}
                                </div>
                                <div>
                                    <h2 className="font-display text-2xl font-bold text-neutral-900">
                                        {phase.theme}
                                    </h2>
                                    <p className="text-neutral-500">{phase.tagline}</p>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="grid gap-4 sm:grid-cols-2">
                                {phase.items.map((item) => {
                                    const status = statusConfig[item.status];
                                    const StatusIcon = status.icon;
                                    return (
                                        <div
                                            key={item.title}
                                            className="rounded-xl border border-neutral-200 p-5 hover:border-neutral-300 transition-colors"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                                                    <item.icon className="w-5 h-5 text-neutral-600" />
                                                </div>
                                                <span
                                                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${status.color}`}
                                                >
                          <StatusIcon className="w-3 h-3" />
                                                    {status.label}
                        </span>
                                            </div>
                                            <h3 className="font-semibold text-neutral-900 mb-1">
                                                {item.title}
                                            </h3>
                                            <p className="text-sm text-neutral-500 leading-relaxed">
                                                {item.description}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>

                {/* CTA */}
                <div className="mt-20 text-center rounded-2xl bg-neutral-50 border border-neutral-200 p-10">
                    <h2 className="font-display text-2xl font-bold text-neutral-900 mb-3">
                        Have a feature request?
                    </h2>
                    <p className="text-neutral-500 mb-6 max-w-lg mx-auto">
                        We build CEO Sidekick based on what entrepreneurs actually need.
                        Tell us what would make the biggest difference for your business.
                    </p>

                   <a href="mailto:support@ceosidekick.biz?subject=Feature Request"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-neutral-950 text-white font-medium hover:bg-neutral-800 transition-colors"
                    >
                    Share Your Idea
                </a>
            </div>
        </div>
</div>
);
}