// src/app/(dashboard)/content-engine/web-blogs/new/page.tsx
// Content Engine - Create New Web Blog

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Newspaper,
    Sparkles,
    Save,
    Loader2,
    Wand2,
    AlertCircle,
    X,
    Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const WORD_COUNT_OPTIONS = [
    { value: "800", label: "Short (~800 words)" },
    { value: "1200", label: "Medium (~1,200 words)" },
    { value: "1500", label: "Standard (~1,500 words)" },
    { value: "2000", label: "Long (~2,000 words)" },
];

const TONE_OPTIONS = [
    { value: "professional", label: "Professional" },
    { value: "conversational", label: "Conversational" },
    { value: "educational", label: "Educational" },
    { value: "authoritative", label: "Authoritative" },
    { value: "friendly", label: "Friendly" },
];

const CATEGORY_SUGGESTIONS = [
    "Technology",
    "Business",
    "Marketing",
    "Leadership",
    "Industry Insights",
    "How-To Guides",
    "Case Studies",
    "News & Updates",
];

export default function NewBlogPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode") || "ai";
    const fromArticle = searchParams.get("fromArticle");

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");

    // AI generation state
    const [topic, setTopic] = useState("");
    const [targetAudience, setTargetAudience] = useState("");
    const [keywords, setKeywords] = useState("");
    const [tone, setTone] = useState("professional");
    const [wordCount, setWordCount] = useState("1500");

    // Article state (if adapting from article)
    const [articleTitle, setArticleTitle] = useState("");
    const [articleContent, setArticleContent] = useState("");

    // UI state
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showEditor, setShowEditor] = useState(mode === "manual");

    // Load article if fromArticle is provided
    useEffect(() => {
        if (fromArticle) {
            loadArticle(fromArticle);
        }
    }, [fromArticle]);

    const loadArticle = async (articleId: string) => {
        try {
            const response = await fetch(`/api/content/articles/${articleId}`);
            const data = await response.json();
            if (response.ok && data.article) {
                setArticleTitle(data.article.title || "");
                setArticleContent(data.article.content || "");
                setTopic(`Adapt article: ${data.article.title}`);
            }
        } catch (err) {
            console.error("Failed to load article:", err);
        }
    };

    const handleGenerate = async () => {
        if (!topic.trim() && !articleContent) {
            setError("Please enter a topic");
            return;
        }

        setGenerating(true);
        setError(null);

        try {
            const response = await fetch("/api/content/blogs/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic: topic.trim(),
                    targetAudience: targetAudience.trim() || undefined,
                    keywords: keywords.trim()
                        ? keywords.split(",").map(k => k.trim()).filter(k => k)
                        : undefined,
                    tone,
                    wordCount,
                    articleContent: articleContent || undefined,
                    articleTitle: articleTitle || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Generation failed");
            }

            setTitle(data.generated.title);
            setDescription(data.generated.description);
            setContent(data.generated.content);
            setCategory(data.generated.category);
            setTags(data.generated.tags || []);
            setShowEditor(true);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to generate blog";
            setError(errorMessage);
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            setError("Please enter a title");
            return;
        }
        if (!content.trim()) {
            setError("Please enter content");
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const response = await fetch("/api/content/blogs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    content: content.trim(),
                    description: description.trim() || undefined,
                    category: category.trim() || undefined,
                    tags: tags.length > 0 ? tags : undefined,
                    generatedFromPrompt: topic.trim() || undefined,
                    aiModel: topic.trim() ? "claude-sonnet-4-20250514" : undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to save blog");
            }

            router.push(`/content-engine/web-blogs/${data.blog.id}`);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to save blog";
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const addTag = () => {
        const tag = tagInput.trim();
        if (tag && !tags.includes(tag)) {
            setTags([...tags, tag]);
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag();
        }
    };

    const wordCountActual = content.split(/\s+/).filter(w => w.length > 0).length;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/content-engine/web-blogs"
                    className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Blogs
                </Link>

                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Newspaper className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl font-bold text-neutral-900">
                            {showEditor ? "Edit Blog Post" : "Create New Blog Post"}
                        </h1>
                        <p className="text-neutral-600">
                            {showEditor
                                ? "Review and edit your blog post before saving"
                                : fromArticle
                                    ? "Adapt your LinkedIn article into an SEO-optimized blog"
                                    : "Generate with AI or write from scratch"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Mode Toggle */}
            {!showEditor && !fromArticle && (
                <div className="mb-6">
                    <div className="flex rounded-lg border border-neutral-200 overflow-hidden w-fit">
                        <Link
                            href="/content-engine/web-blogs/new"
                            className={`px-4 py-2 text-sm flex items-center gap-2 ${
                                mode === "ai"
                                    ? "bg-emerald-50 text-emerald-700 font-medium"
                                    : "text-neutral-600 hover:bg-neutral-50"
                            }`}
                        >
                            <Sparkles className="w-4 h-4" />
                            Generate with AI
                        </Link>
                        <Link
                            href="/content-engine/web-blogs/new?mode=manual"
                            className={`px-4 py-2 text-sm border-l border-neutral-200 flex items-center gap-2 ${
                                mode === "manual"
                                    ? "bg-emerald-50 text-emerald-700 font-medium"
                                    : "text-neutral-600 hover:bg-neutral-50"
                            }`}
                        >
                            <Newspaper className="w-4 h-4" />
                            Write Manually
                        </Link>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* AI Generation Form */}
            {!showEditor && (mode === "ai" || fromArticle) && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6">
                    <h2 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-emerald-600" />
                        {fromArticle ? "Adapt Article to Blog" : "AI Blog Generator"}
                    </h2>

                    <div className="space-y-4">
                        {fromArticle && articleTitle && (
                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                                <p className="text-sm text-emerald-700">
                                    <strong>Source Article:</strong> {articleTitle}
                                </p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                {fromArticle ? "Additional Focus" : "Topic / Main Idea"}
                                {!fromArticle && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder={
                                    fromArticle
                                        ? "Any specific angle or keywords to emphasize?"
                                        : "e.g., Complete Guide to Remote Team Management"
                                }
                                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Target Audience
                                    <span className="text-neutral-400 font-normal"> (optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={targetAudience}
                                    onChange={(e) => setTargetAudience(e.target.value)}
                                    placeholder="e.g., Small business owners"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Target Keywords
                                    <span className="text-neutral-400 font-normal"> (comma-separated)</span>
                                </label>
                                <input
                                    type="text"
                                    value={keywords}
                                    onChange={(e) => setKeywords(e.target.value)}
                                    placeholder="e.g., remote work, productivity, team management"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Tone
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {TONE_OPTIONS.map((t) => (
                                        <button
                                            key={t.value}
                                            onClick={() => setTone(t.value)}
                                            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                                tone === t.value
                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium"
                                                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                                            }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Target Length
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {WORD_COUNT_OPTIONS.map((wc) => (
                                        <button
                                            key={wc.value}
                                            onClick={() => setWordCount(wc.value)}
                                            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                                                wordCount === wc.value
                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-medium"
                                                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                                            }`}
                                        >
                                            {wc.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                onClick={handleGenerate}
                                disabled={generating || (!topic.trim() && !fromArticle)}
                                className="w-full"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Generating Blog Post...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Generate Blog Post
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual / Editor Form */}
            {(showEditor || mode === "manual") && (
                <div className="space-y-6">
                    {/* Title & Meta */}
                    <div className="bg-white rounded-xl border border-neutral-200 p-6">
                        <h3 className="font-medium text-neutral-900 mb-4">SEO Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter a compelling, keyword-rich title"
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                                <p className="text-xs text-neutral-500 mt-1">
                                    {title.length}/60 characters (recommended for SEO)
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Meta Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Write a compelling description that encourages clicks from search results"
                                    rows={2}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                                />
                                <p className={`text-xs mt-1 ${description.length > 160 ? "text-amber-600" : "text-neutral-500"}`}>
                                    {description.length}/160 characters
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Category
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                            placeholder="e.g., Technology"
                                            list="category-suggestions"
                                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        />
                                        <datalist id="category-suggestions">
                                            {CATEGORY_SUGGESTIONS.map((cat) => (
                                                <option key={cat} value={cat} />
                                            ))}
                                        </datalist>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Tags
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={handleTagKeyDown}
                                            placeholder="Add tag and press Enter"
                                            className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        />
                                        <Button type="button" variant="outline" onClick={addTag}>
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 text-sm rounded"
                                        >
                                            {tag}
                                            <button
                                                onClick={() => removeTag(tag)}
                                                className="hover:text-emerald-900"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="bg-white rounded-xl border border-neutral-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium text-neutral-900">Content</h3>
                            <span className="text-sm text-neutral-500">
                                {wordCountActual} words
                            </span>
                        </div>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your blog content in Markdown...&#10;&#10;## Introduction&#10;Start with a hook that addresses your reader's pain point.&#10;&#10;## Main Section&#10;Provide valuable, actionable content."
                            rows={20}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none font-mono text-sm"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between">
                        {showEditor && mode !== "manual" ? (
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowEditor(false);
                                    setTitle("");
                                    setDescription("");
                                    setContent("");
                                    setCategory("");
                                    setTags([]);
                                }}
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Generator
                            </Button>
                        ) : (
                            <Link href="/content-engine/web-blogs">
                                <Button variant="outline">Cancel</Button>
                            </Link>
                        )}
                        <Button
                            onClick={handleSave}
                            disabled={saving || !title.trim() || !content.trim()}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Draft
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
