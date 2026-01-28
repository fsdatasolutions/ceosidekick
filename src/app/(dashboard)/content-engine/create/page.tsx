// src/app/(dashboard)/content-engine/create/page.tsx
// Unified Content Creation - Enter brief once, generate multiple content types

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    Sparkles,
    Image as ImageIcon,
    FileText,
    MessageSquare,
    Newspaper,
    Loader2,
    Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type Step = 'brief' | 'outputs' | 'generating' | 'review';

interface ContentBrief {
    topic: string;
    targetAudience: string;
    keyPoints: string;
    tone: string;
}

interface OutputSelection {
    image: boolean;
    linkedinArticle: boolean;
    linkedinPost: boolean;
    webBlog: boolean;
}

export default function CreateContentPage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>('brief');

    // Brief state
    const [brief, setBrief] = useState<ContentBrief>({
        topic: '',
        targetAudience: '',
        keyPoints: '',
        tone: 'professional',
    });

    // Output selection state
    const [outputs, setOutputs] = useState<OutputSelection>({
        image: true,
        linkedinArticle: true,
        linkedinPost: true,
        webBlog: false,
    });

    // Campaign state
    const [campaignId, setCampaignId] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleBriefSubmit = () => {
        if (!brief.topic.trim()) {
            setError('Please enter a topic');
            return;
        }
        setError(null);
        setStep('outputs');
    };

    const handleOutputsSubmit = async () => {
        const hasOutput = outputs.image || outputs.linkedinArticle || outputs.linkedinPost || outputs.webBlog;
        if (!hasOutput) {
            setError('Please select at least one output type');
            return;
        }

        setError(null);
        setStep('generating');
        setGenerating(true);

        try {
            console.log("[Create Page] Starting campaign generation...");

            const response = await fetch('/api/content/campaigns/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    brief: {
                        topic: brief.topic.trim(),
                        targetAudience: brief.targetAudience.trim() || undefined,
                        keyPoints: brief.keyPoints.trim()
                            ? brief.keyPoints.split('\n').filter(p => p.trim())
                            : undefined,
                        tone: brief.tone,
                    },
                    outputs: {
                        generateImage: outputs.image,
                        generateLinkedinArticle: outputs.linkedinArticle,
                        generateLinkedinPost: outputs.linkedinPost,
                        generateWebBlog: outputs.webBlog,
                    },
                }),
            });

            console.log("[Create Page] Response status:", response.status);

            const data = await response.json();
            console.log("[Create Page] Response data:", data);

            if (!response.ok) {
                throw new Error(data.error || 'Generation failed');
            }

            if (!data.campaign || !data.campaign.id) {
                console.error("[Create Page] Invalid campaign data:", data);
                throw new Error('Invalid campaign data received');
            }

            const campaignIdValue = data.campaign.id;
            console.log("[Create Page] Campaign ID:", campaignIdValue);

            setCampaignId(campaignIdValue);

            // Store campaign data in sessionStorage before redirecting
            const storageKey = `campaign-${campaignIdValue}`;
            const campaignJson = JSON.stringify(data.campaign);

            console.log("[Create Page] Storing in sessionStorage with key:", storageKey);
            console.log("[Create Page] Campaign data length:", campaignJson.length);

            try {
                sessionStorage.setItem(storageKey, campaignJson);

                // Verify it was stored
                const verified = sessionStorage.getItem(storageKey);
                console.log("[Create Page] Verified storage:", verified ? "SUCCESS" : "FAILED");
                console.log("[Create Page] Stored data length:", verified?.length);
            } catch (storageError) {
                console.error("[Create Page] sessionStorage error:", storageError);
                // Continue anyway - the API fallback should work
            }

            // Small delay to ensure storage is written
            await new Promise(resolve => setTimeout(resolve, 100));

            // Redirect to review page with campaign ID
            const reviewUrl = `/content-engine/create/${campaignIdValue}/review`;
            console.log("[Create Page] Redirecting to:", reviewUrl);

            router.push(reviewUrl);
        } catch (err: unknown) {
            console.error("[Create Page] Error:", err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to generate content';
            setError(errorMessage);
            setStep('outputs');
        } finally {
            setGenerating(false);
        }
    };

    const toneOptions = [
        { value: 'professional', label: 'Professional' },
        { value: 'conversational', label: 'Conversational' },
        { value: 'thought-provoking', label: 'Thought-Provoking' },
        { value: 'inspiring', label: 'Inspiring' },
        { value: 'educational', label: 'Educational' },
    ];

    const outputOptions = [
        {
            key: 'image' as const,
            label: 'Hero Image',
            description: 'AI-generated image for your content',
            icon: ImageIcon,
            color: 'bg-violet-100 text-violet-600',
        },
        {
            key: 'linkedinArticle' as const,
            label: 'LinkedIn Article',
            description: 'Long-form thought leadership piece',
            icon: FileText,
            color: 'bg-blue-100 text-blue-600',
        },
        {
            key: 'linkedinPost' as const,
            label: 'LinkedIn Post',
            description: 'Short engaging post (derived from article)',
            icon: MessageSquare,
            color: 'bg-sky-100 text-sky-600',
        },
        {
            key: 'webBlog' as const,
            label: 'Web Blog',
            description: 'SEO-optimized blog post with frontmatter',
            icon: Newspaper,
            color: 'bg-emerald-100 text-emerald-600',
        },
    ];

    return (
        <div className="p-8 max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/content-engine"
                    className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Content Engine
                </Link>

                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-red to-amber-500 flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl font-bold text-neutral-900">
                            Create Content Campaign
                        </h1>
                        <p className="text-neutral-600">
                            Enter your brief once, generate multiple content types
                        </p>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
                <div className="flex items-center gap-2">
                    {['brief', 'outputs', 'generating', 'review'].map((s, i) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                step === s
                                    ? 'bg-primary-red text-white'
                                    : ['brief', 'outputs', 'generating', 'review'].indexOf(step) > i
                                        ? 'bg-green-500 text-white'
                                        : 'bg-neutral-200 text-neutral-500'
                            }`}>
                                {['brief', 'outputs', 'generating', 'review'].indexOf(step) > i ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    i + 1
                                )}
                            </div>
                            {i < 3 && (
                                <div className={`w-12 h-0.5 ${
                                    ['brief', 'outputs', 'generating', 'review'].indexOf(step) > i
                                        ? 'bg-green-500'
                                        : 'bg-neutral-200'
                                }`} />
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-neutral-500">
                    <span>Brief</span>
                    <span>Outputs</span>
                    <span>Generate</span>
                    <span>Review</span>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Step 1: Content Brief */}
            {step === 'brief' && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h2 className="font-semibold text-neutral-900 mb-4">
                        Content Brief
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Topic / Main Idea <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={brief.topic}
                                onChange={(e) => setBrief({ ...brief, topic: e.target.value })}
                                placeholder="e.g., The Future of Remote Work in 2025"
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red/20 focus:border-primary-red"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Target Audience
                                <span className="text-neutral-400 font-normal"> (optional)</span>
                            </label>
                            <input
                                type="text"
                                value={brief.targetAudience}
                                onChange={(e) => setBrief({ ...brief, targetAudience: e.target.value })}
                                placeholder="e.g., Tech executives, startup founders, HR professionals"
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red/20 focus:border-primary-red"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Key Points to Cover
                                <span className="text-neutral-400 font-normal"> (one per line, optional)</span>
                            </label>
                            <textarea
                                value={brief.keyPoints}
                                onChange={(e) => setBrief({ ...brief, keyPoints: e.target.value })}
                                placeholder="Productivity benefits&#10;Challenges of hybrid teams&#10;Tools and technologies"
                                rows={4}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red/20 focus:border-primary-red resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Tone
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {toneOptions.map((t) => (
                                    <button
                                        key={t.value}
                                        onClick={() => setBrief({ ...brief, tone: t.value })}
                                        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                            brief.tone === t.value
                                                ? 'border-primary-red bg-primary-red/5 text-primary-red font-medium'
                                                : 'border-neutral-200 text-neutral-600 hover:border-neutral-300'
                                        }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <Button onClick={handleBriefSubmit}>
                                Continue
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Select Outputs */}
            {step === 'outputs' && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h2 className="font-semibold text-neutral-900 mb-4">
                        Select Content Types
                    </h2>
                    <p className="text-sm text-neutral-600 mb-6">
                        Choose which content types to generate. All will use the same brief.
                    </p>

                    <div className="space-y-3">
                        {outputOptions.map((option) => {
                            const Icon = option.icon;
                            const isSelected = outputs[option.key];

                            return (
                                <button
                                    key={option.key}
                                    onClick={() => setOutputs({ ...outputs, [option.key]: !isSelected })}
                                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                                        isSelected
                                            ? 'border-primary-red bg-primary-red/5 ring-1 ring-primary-red/20'
                                            : 'border-neutral-200 hover:border-neutral-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-lg ${option.color} flex items-center justify-center flex-shrink-0`}>
                                            <Icon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-neutral-900">
                                                {option.label}
                                            </h3>
                                            <p className="text-sm text-neutral-500">
                                                {option.description}
                                            </p>
                                        </div>
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                            isSelected
                                                ? 'border-primary-red bg-primary-red'
                                                : 'border-neutral-300'
                                        }`}>
                                            {isSelected && <Check className="w-4 h-4 text-white" />}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Dependency Note */}
                    {outputs.linkedinPost && !outputs.linkedinArticle && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                            <strong>Note:</strong> LinkedIn Post works best when generated alongside a LinkedIn Article.
                            The post will summarize/promote the article.
                        </div>
                    )}

                    <div className="pt-6 flex justify-between">
                        <Button variant="outline" onClick={() => setStep('brief')}>
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                        <Button onClick={handleOutputsSubmit}>
                            <Sparkles className="w-4 h-4" />
                            Generate Content
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 3: Generating */}
            {step === 'generating' && (
                <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary-red/10 flex items-center justify-center mx-auto mb-6">
                        <Loader2 className="w-8 h-8 text-primary-red animate-spin" />
                    </div>
                    <h2 className="font-semibold text-xl text-neutral-900 mb-2">
                        Generating Your Content
                    </h2>
                    <p className="text-neutral-600 mb-6">
                        This may take a minute. We&apos;re creating:
                    </p>
                    <div className="flex justify-center gap-4 flex-wrap">
                        {outputs.image && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-full text-sm">
                                <ImageIcon className="w-4 h-4" />
                                Hero Image
                            </div>
                        )}
                        {outputs.linkedinArticle && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm">
                                <FileText className="w-4 h-4" />
                                Article
                            </div>
                        )}
                        {outputs.linkedinPost && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-100 text-sky-700 rounded-full text-sm">
                                <MessageSquare className="w-4 h-4" />
                                Post
                            </div>
                        )}
                        {outputs.webBlog && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm">
                                <Newspaper className="w-4 h-4" />
                                Blog
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}