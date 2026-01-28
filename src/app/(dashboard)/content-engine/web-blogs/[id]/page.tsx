// src/app/(dashboard)/content-engine/web-blogs/[id]/page.tsx
// Content Engine - Edit Web Blog

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Newspaper,
    Save,
    Loader2,
    Trash2,
    CheckCircle,
    Archive,
    RotateCcw,
    RefreshCw,
    Sparkles,
    X,
    Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Blog {
    id: string;
    title: string;
    description: string | null;
    content: string;
    status: string;
    category: string | null;
    tags: string[] | null;
    heroImageId: string | null;
    publishedAt: string | null;
    scheduledFor: string | null;
    generatedFromPrompt: string | null;
    createdAt: string;
    updatedAt: string;
}

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    // Blog state
    const [blog, setBlog] = useState<Blog | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [content, setContent] = useState("");
    const [category, setCategory] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");

    // UI state
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Load blog
    useEffect(() => {
        async function loadBlog() {
            try {
                const response = await fetch(`/api/content/blogs/${id}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to load blog");
                }

                setBlog(data.blog);
                setTitle(data.blog.title || "");
                setDescription(data.blog.description || "");
                setContent(data.blog.content || "");
                setCategory(data.blog.category || "");
                setTags(data.blog.tags || []);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load blog";
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        }

        loadBlog();
    }, [id]);

    // Track changes
    useEffect(() => {
        if (blog) {
            const changed =
                title !== (blog.title || "") ||
                description !== (blog.description || "") ||
                content !== (blog.content || "") ||
                category !== (blog.category || "") ||
                JSON.stringify(tags) !== JSON.stringify(blog.tags || []);
            setHasChanges(changed);
        }
    }, [title, description, content, category, tags, blog]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            const response = await fetch(`/api/content/blogs/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || null,
                    content: content.trim(),
                    category: category.trim() || null,
                    tags: tags.length > 0 ? tags : null,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to save");
            }

            setBlog((prev) => (prev ? { ...prev, ...data.blog } : null));
            setHasChanges(false);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to save";
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleRegenerate = async () => {
        if (!blog?.generatedFromPrompt) {
            setError("No original prompt to regenerate from");
            return;
        }

        setRegenerating(true);
        setError(null);

        try {
            const response = await fetch("/api/content/blogs/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic: blog.generatedFromPrompt,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Regeneration failed");
            }

            setTitle(data.generated.title);
            setDescription(data.generated.description);
            setContent(data.generated.content);
            setCategory(data.generated.category);
            setTags(data.generated.tags || []);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to regenerate";
            setError(errorMessage);
        } finally {
            setRegenerating(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        try {
            const response = await fetch(`/api/content/blogs/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to update status");
            }

            setBlog((prev) =>
                prev ? { ...prev, status: newStatus, publishedAt: data.blog.publishedAt } : null
            );
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to update status";
            setError(errorMessage);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Delete this blog post? This cannot be undone.")) {
            return;
        }

        setDeleting(true);
        try {
            const response = await fetch(`/api/content/blogs/${id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to delete");
            }

            router.push("/content-engine/web-blogs");
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to delete";
            setError(errorMessage);
            setDeleting(false);
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
        setTags(tags.filter((t) => t !== tagToRemove));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag();
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (!blog) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                    {error || "Blog not found"}
                </div>
                <Link href="/content-engine/web-blogs" className="mt-4 inline-block">
                    <Button variant="outline">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Blogs
                    </Button>
                </Link>
            </div>
        );
    }

    const wordCount = content.split(/\s+/).filter((w) => w.length > 0).length;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/content-engine/web-blogs"
                    className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Blogs
                </Link>

                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Newspaper className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-display text-2xl font-bold text-neutral-900">
                                    Edit Blog Post
                                </h1>
                                <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${
                                        blog.status === "published"
                                            ? "bg-green-100 text-green-700"
                                            : blog.status === "archived"
                                                ? "bg-neutral-100 text-neutral-500"
                                                : "bg-amber-100 text-amber-700"
                                    }`}
                                >
                                    {blog.status}
                                </span>
                                {hasChanges && (
                                    <span className="text-xs text-amber-600">• Unsaved changes</span>
                                )}
                            </div>
                            <p className="text-neutral-600 text-sm">
                                Last updated {new Date(blog.updatedAt).toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {blog.status === "draft" && (
                            <Button variant="outline" onClick={() => handleStatusChange("published")}>
                                <CheckCircle className="w-4 h-4" />
                                Publish
                            </Button>
                        )}
                        {blog.status === "published" && (
                            <Button variant="outline" onClick={() => handleStatusChange("archived")}>
                                <Archive className="w-4 h-4" />
                                Archive
                            </Button>
                        )}
                        {blog.status === "archived" && (
                            <Button variant="outline" onClick={() => handleStatusChange("draft")}>
                                <RotateCcw className="w-4 h-4" />
                                Restore
                            </Button>
                        )}
                        <Button onClick={handleSave} disabled={saving || !hasChanges}>
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Save
                        </Button>
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Editor */}
                <div className="lg:col-span-2 space-y-6">
                    {/* SEO Details */}
                    <div className="bg-white rounded-xl border border-neutral-200 p-6">
                        <h3 className="font-medium text-neutral-900 mb-4">SEO Details</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                />
                                <p className="text-xs text-neutral-500 mt-1">
                                    {title.length}/60 characters
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Meta Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                                />
                                <p
                                    className={`text-xs mt-1 ${
                                        description.length > 160 ? "text-amber-600" : "text-neutral-500"
                                    }`}
                                >
                                    {description.length}/160 characters
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                                        Category
                                    </label>
                                    <input
                                        type="text"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                    />
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
                                            placeholder="Add tag"
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
                            <div className="flex items-center gap-3">
                                {blog.generatedFromPrompt && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={handleRegenerate}
                                        disabled={regenerating}
                                    >
                                        {regenerating ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-3 h-3" />
                                        )}
                                        Regenerate
                                    </Button>
                                )}
                                <span className="text-sm text-neutral-500">{wordCount} words</span>
                            </div>
                        </div>
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={25}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none font-mono text-sm"
                        />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Blog Info */}
                    <div className="bg-white rounded-xl border border-neutral-200 p-4">
                        <h3 className="font-medium text-neutral-900 mb-3">Blog Info</h3>
                        <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <dt className="text-neutral-500">Status</dt>
                                <dd
                                    className={`font-medium ${
                                        blog.status === "published"
                                            ? "text-green-600"
                                            : blog.status === "archived"
                                                ? "text-neutral-500"
                                                : "text-amber-600"
                                    }`}
                                >
                                    {blog.status.charAt(0).toUpperCase() + blog.status.slice(1)}
                                </dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-neutral-500">Word Count</dt>
                                <dd className="text-neutral-900">{wordCount}</dd>
                            </div>
                            <div className="flex justify-between">
                                <dt className="text-neutral-500">Created</dt>
                                <dd className="text-neutral-900">
                                    {new Date(blog.createdAt).toLocaleDateString()}
                                </dd>
                            </div>
                            {blog.publishedAt && (
                                <div className="flex justify-between">
                                    <dt className="text-neutral-500">Published</dt>
                                    <dd className="text-neutral-900">
                                        {new Date(blog.publishedAt).toLocaleDateString()}
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* Original Prompt */}
                    {blog.generatedFromPrompt && (
                        <div className="bg-white rounded-xl border border-neutral-200 p-4">
                            <h3 className="font-medium text-neutral-900 mb-2 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-emerald-600" />
                                Generated From
                            </h3>
                            <p className="text-sm text-neutral-600">{blog.generatedFromPrompt}</p>
                        </div>
                    )}

                    {/* SEO Preview */}
                    <div className="bg-white rounded-xl border border-neutral-200 p-4">
                        <h3 className="font-medium text-neutral-900 mb-3">Search Preview</h3>
                        <div className="p-3 bg-neutral-50 rounded-lg">
                            <p className="text-blue-700 text-sm font-medium truncate hover:underline cursor-pointer">
                                {title || "Blog Post Title"}
                            </p>
                            <p className="text-green-700 text-xs truncate">
                                yourwebsite.com/blog/{blog.id.slice(0, 8)}
                            </p>
                            <p className="text-neutral-600 text-xs mt-1 line-clamp-2">
                                {description || "Add a meta description to improve click-through rates from search results."}
                            </p>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="bg-white rounded-xl border border-red-200 p-4">
                        <h3 className="font-medium text-red-700 mb-3">Danger Zone</h3>
                        <Button
                            variant="outline"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="w-full text-red-600 border-red-200 hover:bg-red-50"
                        >
                            {deleting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Trash2 className="w-4 h-4" />
                            )}
                            Delete Blog Post
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
