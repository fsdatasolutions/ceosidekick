// src/app/(dashboard)/documents/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
    FileText,
    Presentation,
    FileSpreadsheet,
    File,
    Download,
    Loader2,
    Lock,
    Sparkles,
    FileCheck,
    ClipboardList,
    Receipt,
    Users,
    Target,
    TrendingUp,
    Briefcase,
} from "lucide-react";
import Link from "next/link";

interface UsageInfo {
    tier: string;
    canSendMessage: boolean;
}

interface DocumentTemplate {
    id: string;
    name: string;
    description: string;
    icon: React.ElementType;
    type: "docx" | "pptx" | "pdf" | "xlsx";
    category: "business" | "finance" | "hr" | "marketing";
    color: string;
}

const templates: DocumentTemplate[] = [
    // Business Documents
    {
        id: "business-plan",
        name: "Business Plan",
        description: "Professional business plan with executive summary, market analysis, and financial projections",
        icon: Briefcase,
        type: "docx",
        category: "business",
        color: "blue",
    },
    {
        id: "pitch-deck",
        name: "Pitch Deck",
        description: "Investor-ready presentation with problem, solution, market, and traction slides",
        icon: Presentation,
        type: "pptx",
        category: "business",
        color: "purple",
    },
    {
        id: "meeting-notes",
        name: "Meeting Notes",
        description: "Structured meeting notes template with attendees, agenda, and action items",
        icon: ClipboardList,
        type: "docx",
        category: "business",
        color: "green",
    },
    {
        id: "project-proposal",
        name: "Project Proposal",
        description: "Detailed project proposal with scope, timeline, budget, and deliverables",
        icon: Target,
        type: "docx",
        category: "business",
        color: "amber",
    },
    // Finance Documents
    {
        id: "invoice",
        name: "Invoice",
        description: "Professional invoice template for billing clients",
        icon: Receipt,
        type: "pdf",
        category: "finance",
        color: "emerald",
    },
    {
        id: "expense-report",
        name: "Expense Report",
        description: "Track and categorize business expenses with totals",
        icon: FileSpreadsheet,
        type: "xlsx",
        category: "finance",
        color: "teal",
    },
    // HR Documents
    {
        id: "employee-handbook",
        name: "Employee Handbook",
        description: "Company policies, procedures, and employee guidelines",
        icon: Users,
        type: "docx",
        category: "hr",
        color: "rose",
    },
    {
        id: "job-description",
        name: "Job Description",
        description: "Professional job posting with responsibilities and requirements",
        icon: FileCheck,
        type: "docx",
        category: "hr",
        color: "pink",
    },
    // Marketing Documents
    {
        id: "marketing-plan",
        name: "Marketing Plan",
        description: "Comprehensive marketing strategy with channels, budget, and KPIs",
        icon: TrendingUp,
        type: "docx",
        category: "marketing",
        color: "orange",
    },
    {
        id: "brand-guidelines",
        name: "Brand Guidelines",
        description: "Brand identity document with logo usage, colors, and typography",
        icon: Sparkles,
        type: "pdf",
        category: "marketing",
        color: "indigo",
    },
];

const categoryLabels: Record<string, string> = {
    business: "Business",
    finance: "Finance",
    hr: "Human Resources",
    marketing: "Marketing",
};

const typeLabels: Record<string, { label: string; color: string }> = {
    docx: { label: "Word", color: "bg-blue-100 text-blue-700" },
    pptx: { label: "PowerPoint", color: "bg-orange-100 text-orange-700" },
    pdf: { label: "PDF", color: "bg-red-100 text-red-700" },
    xlsx: { label: "Excel", color: "bg-green-100 text-green-700" },
};

const colorClasses: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600",
    amber: "bg-amber-100 text-amber-600",
    emerald: "bg-emerald-100 text-emerald-600",
    teal: "bg-teal-100 text-teal-600",
    rose: "bg-rose-100 text-rose-600",
    pink: "bg-pink-100 text-pink-600",
    orange: "bg-orange-100 text-orange-600",
    indigo: "bg-indigo-100 text-indigo-600",
};

export default function DocumentsPage() {
    const [usage, setUsage] = useState<UsageInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // More explicit check - only paid if we have usage data AND tier is not free
    const isPaidUser = usage !== null && usage.tier !== "free";

    useEffect(() => {
        fetchUsage();
    }, []);

    async function fetchUsage() {
        try {
            const res = await fetch("/api/usage");
            if (res.ok) {
                const data = await res.json();
                console.log("[Documents] Usage data:", data);
                // API returns { usage: { tier: "free", ... } } - extract the nested object
                const usageData = data.usage || data;
                setUsage(usageData);
            } else {
                console.log("[Documents] Usage fetch failed:", res.status);
                setUsage({ tier: "free", canSendMessage: true });
            }
        } catch (err) {
            console.error("Failed to fetch usage:", err);
            setUsage({ tier: "free", canSendMessage: true });
        } finally {
            setLoading(false);
        }
    }

    async function handleGenerate(template: DocumentTemplate) {
        if (!isPaidUser) return;

        setGenerating(template.id);
        setError(null);

        try {
            const res = await fetch("/api/templates/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ templateId: template.id }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to generate document");
            }

            // Get the blob and trigger download
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${template.id}.${template.type}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            console.error("Failed to generate document:", err);
            setError(err instanceof Error ? err.message : "Failed to generate document");
        } finally {
            setGenerating(null);
        }
    }

    // Group templates by category
    const groupedTemplates = templates.reduce((acc, template) => {
        if (!acc[template.category]) {
            acc[template.category] = [];
        }
        acc[template.category].push(template);
        return acc;
    }, {} as Record<string, DocumentTemplate[]>);

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="font-display text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
                    Document Templates
                </h1>
                <p className="text-neutral-600">
                    Generate professional business documents with AI assistance
                </p>
            </div>

            {/* Upgrade Banner for Free Users */}
            {!isPaidUser && !loading && (
                <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <Lock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-neutral-900">
                                    Paid Feature
                                </h3>
                                <p className="text-sm text-neutral-600 mt-1">
                                    Document templates are available for paid subscribers only. Upgrade to generate professional documents, pitch decks, invoices, and more.
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/pricing"
                            className="inline-flex items-center justify-center px-4 py-2 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 transition-colors whitespace-nowrap"
                        >
                            Upgrade Now
                        </Link>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Templates by Category */}
            {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                <div key={category} className="mb-8">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                        {categoryLabels[category]}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryTemplates.map((template) => (
                            <div
                                key={template.id}
                                className={`bg-white rounded-xl border border-neutral-200 p-5 transition-all ${
                                    isPaidUser
                                        ? "hover:border-neutral-300 hover:shadow-md cursor-pointer"
                                        : "opacity-75"
                                }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClasses[template.color]}`}>
                                        <template.icon className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-medium text-neutral-900">
                                                {template.name}
                                            </h3>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeLabels[template.type].color}`}>
                        {typeLabels[template.type].label}
                      </span>
                                        </div>
                                        <p className="text-sm text-neutral-500 line-clamp-2">
                                            {template.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <button
                                        onClick={() => handleGenerate(template)}
                                        disabled={!isPaidUser || generating === template.id}
                                        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                            isPaidUser
                                                ? "bg-primary-red text-white hover:bg-primary-red/90 disabled:bg-primary-red/50"
                                                : "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                                        }`}
                                    >
                                        {generating === template.id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Generating...
                                            </>
                                        ) : !isPaidUser ? (
                                            <>
                                                <Lock className="w-4 h-4" />
                                                Upgrade to Generate
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4" />
                                                Generate Document
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Coming Soon Note */}
            <div className="mt-8 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <p className="text-sm text-neutral-600 text-center">
                    <Sparkles className="w-4 h-4 inline mr-1" />
                    More templates coming soon! Have a suggestion?{" "}
                    <Link href="/feedback" className="text-primary-red hover:underline">
                        Let us know
                    </Link>
                </p>
            </div>
        </div>
    );
}