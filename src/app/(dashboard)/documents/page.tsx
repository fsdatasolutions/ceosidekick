// src/app/(dashboard)/documents/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    FileText,
    Presentation,
    Sheet,
    File,
    Download,
    Loader2,
    Crown,
    Sparkles,
    ArrowRight,
    Database,
    Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentPreviewModal } from "@/components/document-preview-modal";

// Template definitions
const templates = [
    // Business
    {
        id: "business-plan",
        name: "Business Plan",
        description: "Comprehensive business plan with executive summary, market analysis, and financial projections",
        category: "Business",
        format: "docx",
        icon: FileText,
    },
    {
        id: "pitch-deck",
        name: "Pitch Deck",
        description: "Investor-ready presentation with problem, solution, market, and financials slides",
        category: "Business",
        format: "pptx",
        icon: Presentation,
    },
    {
        id: "project-proposal",
        name: "Project Proposal",
        description: "Detailed project proposal with scope, timeline, budget, and success metrics",
        category: "Business",
        format: "docx",
        icon: FileText,
    },
    {
        id: "meeting-notes",
        name: "Meeting Notes",
        description: "Structured meeting notes template with attendees, agenda, and action items",
        category: "Business",
        format: "docx",
        icon: FileText,
    },
    // Finance
    {
        id: "invoice",
        name: "Invoice",
        description: "Professional invoice template with itemized billing and payment terms",
        category: "Finance",
        format: "pdf",
        icon: File,
    },
    {
        id: "expense-report",
        name: "Expense Report",
        description: "Detailed expense tracking spreadsheet with categories and totals",
        category: "Finance",
        format: "xlsx",
        icon: Sheet,
    },
    // HR
    {
        id: "employee-handbook",
        name: "Employee Handbook",
        description: "Complete employee handbook with policies, benefits, and workplace guidelines",
        category: "HR",
        format: "docx",
        icon: FileText,
    },
    {
        id: "job-description",
        name: "Job Description",
        description: "Professional job posting with responsibilities, requirements, and benefits",
        category: "HR",
        format: "docx",
        icon: FileText,
    },
    // Marketing
    {
        id: "marketing-plan",
        name: "Marketing Plan",
        description: "Strategic marketing plan with target audience, channels, and budget",
        category: "Marketing",
        format: "docx",
        icon: FileText,
    },
    {
        id: "brand-guidelines",
        name: "Brand Guidelines",
        description: "Complete brand style guide with logo usage, colors, typography, and voice",
        category: "Marketing",
        format: "pdf",
        icon: File,
    },
];

const categories = ["All", "Business", "Finance", "HR", "Marketing"];

interface UsageData {
    tier: string;
    messagesUsed: number;
    messageLimit: number;
}

export default function DocumentsPage() {
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<typeof templates[0] | null>(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        fetchUsage();
    }, []);

    async function fetchUsage() {
        try {
            const res = await fetch("/api/usage");
            if (res.ok) {
                const data = await res.json();
                // Handle nested response structure
                const usageData = data.usage || data;
                setUsage(usageData);
            }
        } catch (err) {
            console.error("Failed to fetch usage:", err);
        } finally {
            setLoading(false);
        }
    }

    const isPaidUser = usage?.tier && usage.tier !== "free";

    const filteredTemplates =
        selectedCategory === "All"
            ? templates
            : templates.filter((t) => t.category === selectedCategory);

    function handleTemplateClick(template: typeof templates[0]) {
        if (!isPaidUser) return;
        setSelectedTemplate(template);
        setIsPreviewOpen(true);
    }

    function getFormatColor(format: string) {
        switch (format) {
            case "docx":
                return "bg-blue-100 text-blue-700";
            case "pptx":
                return "bg-orange-100 text-orange-700";
            case "xlsx":
                return "bg-green-100 text-green-700";
            case "pdf":
                return "bg-red-100 text-red-700";
            default:
                return "bg-neutral-100 text-neutral-700";
        }
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                    Document Templates
                </h1>
                <p className="text-neutral-600">
                    Generate professional documents pre-filled with your company information
                </p>
            </div>

            {/* Upgrade Banner for Free Users */}
            {!isPaidUser && !loading && (
                <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-200">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <Crown className="w-6 h-6 text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-amber-900 mb-1">
                                Unlock Document Generation
                            </h3>
                            <p className="text-amber-700 mb-4">
                                Upgrade to a paid plan to generate professional documents pre-filled with your company information.
                                All documents are automatically personalized based on your settings.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/pricing">
                                    <Button className="bg-amber-600 hover:bg-amber-700">
                                        <Sparkles className="w-4 h-4" />
                                        Upgrade Now
                                    </Button>
                                </Link>
                                <Link href="/settings">
                                    <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                                        Complete Profile First
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Feature Highlight */}
            {isPaidUser && (
                <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-blue-600" />
                        <p className="text-sm text-blue-800">
                            <strong>New!</strong> Generated documents can now be saved directly to your Company Library for AI-powered search and retrieval.
                        </p>
                    </div>
                </div>
            )}

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
                {categories.map((category) => (
                    <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            selectedCategory === category
                                ? "bg-primary-red text-white"
                                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                        }`}
                    >
                        {category}
                    </button>
                ))}
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => {
                    const Icon = template.icon;
                    const isDisabled = !isPaidUser;

                    return (
                        <div
                            key={template.id}
                            onClick={() => handleTemplateClick(template)}
                            className={`group relative p-6 bg-white rounded-xl border transition-all ${
                                isDisabled
                                    ? "border-neutral-200 opacity-60 cursor-not-allowed"
                                    : "border-neutral-200 hover:border-primary-red hover:shadow-lg cursor-pointer"
                            }`}
                        >
                            {/* Lock overlay for free users */}
                            {isDisabled && (
                                <div className="absolute inset-0 bg-white/50 rounded-xl flex items-center justify-center z-10">
                                    <div className="bg-neutral-900/80 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5">
                                        <Crown className="w-3.5 h-3.5" />
                                        Paid Feature
                                    </div>
                                </div>
                            )}

                            <div className="flex items-start gap-4">
                                <div
                                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                                        isDisabled
                                            ? "bg-neutral-100"
                                            : "bg-primary-red/10 group-hover:bg-primary-red/20"
                                    }`}
                                >
                                    <Icon
                                        className={`w-6 h-6 ${
                                            isDisabled ? "text-neutral-400" : "text-primary-red"
                                        }`}
                                    />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-neutral-900 truncate">
                                            {template.name}
                                        </h3>
                                        <span
                                            className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${getFormatColor(
                                                template.format
                                            )}`}
                                        >
                      {template.format}
                    </span>
                                    </div>
                                    <p className="text-sm text-neutral-500 line-clamp-2">
                                        {template.description}
                                    </p>
                                </div>
                            </div>

                            {/* Hover action hint */}
                            {!isDisabled && (
                                <div className="mt-4 flex items-center gap-2 text-sm text-primary-red opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Eye className="w-4 h-4" />
                                    Click to preview & download
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredTemplates.length === 0 && (
                <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                    <p className="text-neutral-500">
                        No templates found in this category
                    </p>
                </div>
            )}

            {/* Preview Modal */}
            <DocumentPreviewModal
                template={selectedTemplate}
                isOpen={isPreviewOpen}
                onClose={() => {
                    setIsPreviewOpen(false);
                    setSelectedTemplate(null);
                }}
            />
        </div>
    );
}