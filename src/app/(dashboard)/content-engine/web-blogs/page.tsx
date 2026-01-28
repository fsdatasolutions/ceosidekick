// src/app/(dashboard)/content-engine/web-blogs/page.tsx
// Content Engine - Web Blogs List

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    Newspaper,
    Plus,
    Sparkles,
    Clock,
    CheckCircle,
    Archive,
    Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { listContentItems } from "@/lib/services/content-items";

interface PageProps {
    searchParams: Promise<{
        status?: string;
        category?: string;
        page?: string;
    }>;
}

function formatRelativeTime(date: Date | null): string {
    if (!date) return "Never";

    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

export default async function WebBlogsPage({ searchParams }: PageProps) {
    const session = await auth();

    if (!session?.user?.id) {
        redirect("/login");
    }

    const userId = session.user.id;
    const params = await searchParams;
    const status = params.status as "draft" | "published" | "archived" | undefined;
    const categoryFilter = params.category;
    const currentPage = parseInt(params.page || "1", 10);
    const limit = 20;
    const offset = (currentPage - 1) * limit;

    // Fetch blogs
    let blogs: Array<{
        id: string;
        title: string | null;
        description: string | null;
        content: string | null;
        status: string;
        category: string | null;
        tags: string[] | null;
        publishedAt: Date | null;
        updatedAt: Date;
    }> = [];
    let pagination = { total: 0, limit, offset, hasMore: false };
    let categories: string[] = [];

    try {
        const result = await listContentItems({
            userId,
            type: "web_blog",
            status,
            limit: 100, // Get more to extract categories
            offset: 0,
        });

        // Extract unique categories
        const categorySet = new Set<string>();
        result.items.forEach(item => {
            if (item.category) categorySet.add(item.category);
        });
        categories = Array.from(categorySet).sort();

        // Filter by category if provided
        let filteredItems = result.items;
        if (categoryFilter) {
            filteredItems = result.items.filter(item => item.category === categoryFilter);
        }

        // Apply pagination
        const totalFiltered = filteredItems.length;
        blogs = filteredItems.slice(offset, offset + limit);
        pagination = {
            total: totalFiltered,
            limit,
            offset,
            hasMore: offset + limit < totalFiltered,
        };
    } catch (error) {
        console.error("Failed to fetch blogs:", error);
    }

    const total = pagination.total;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/content-engine"
                    className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Content Engine
                </Link>

                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Newspaper className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="font-display text-2xl font-bold text-neutral-900">
                                Web Blogs
                            </h1>
                            <p className="text-neutral-600">
                                SEO-optimized blog posts for your website
                            </p>
                        </div>
                    </div>

                    <Link href="/content-engine/web-blogs/new">
                        <Button>
                            <Plus className="w-4 h-4" />
                            New Blog Post
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 space-y-3">
                {/* Status Filter */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-500">Status:</span>
                    <div className="flex rounded-lg border border-neutral-200 overflow-hidden">
                        <Link
                            href={`/content-engine/web-blogs${categoryFilter ? `?category=${categoryFilter}` : ""}`}
                            className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${
                                !status
                                    ? "bg-neutral-100 text-neutral-900 font-medium"
                                    : "text-neutral-600 hover:bg-neutral-50"
                            }`}
                        >
                            All
                        </Link>
                        <Link
                            href={`/content-engine/web-blogs?status=draft${categoryFilter ? `&category=${categoryFilter}` : ""}`}
                            className={`px-3 py-1.5 text-sm border-l border-neutral-200 flex items-center gap-1.5 ${
                                status === "draft"
                                    ? "bg-neutral-100 text-neutral-900 font-medium"
                                    : "text-neutral-600 hover:bg-neutral-50"
                            }`}
                        >
                            <Clock className="w-3.5 h-3.5" />
                            Drafts
                        </Link>
                        <Link
                            href={`/content-engine/web-blogs?status=published${categoryFilter ? `&category=${categoryFilter}` : ""}`}
                            className={`px-3 py-1.5 text-sm border-l border-neutral-200 flex items-center gap-1.5 ${
                                status === "published"
                                    ? "bg-neutral-100 text-neutral-900 font-medium"
                                    : "text-neutral-600 hover:bg-neutral-50"
                            }`}
                        >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Published
                        </Link>
                        <Link
                            href={`/content-engine/web-blogs?status=archived${categoryFilter ? `&category=${categoryFilter}` : ""}`}
                            className={`px-3 py-1.5 text-sm border-l border-neutral-200 flex items-center gap-1.5 ${
                                status === "archived"
                                    ? "bg-neutral-100 text-neutral-900 font-medium"
                                    : "text-neutral-600 hover:bg-neutral-50"
                            }`}
                        >
                            <Archive className="w-3.5 h-3.5" />
                            Archived
                        </Link>
                    </div>
                </div>

                {/* Category Filter */}
                {categories.length > 0 && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-500">Category:</span>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href={`/content-engine/web-blogs${status ? `?status=${status}` : ""}`}
                                className={`px-3 py-1 text-sm rounded-full border ${
                                    !categoryFilter
                                        ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                                        : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                                }`}
                            >
                                All
                            </Link>
                            {categories.map((cat) => (
                                <Link
                                    key={cat}
                                    href={`/content-engine/web-blogs?category=${encodeURIComponent(cat)}${status ? `&status=${status}` : ""}`}
                                    className={`px-3 py-1 text-sm rounded-full border ${
                                        categoryFilter === cat
                                            ? "bg-emerald-100 border-emerald-300 text-emerald-700"
                                            : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                                    }`}
                                >
                                    {cat}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div className="text-sm text-neutral-500">
                    {total} blog post{total !== 1 ? "s" : ""}
                </div>
            </div>

            {/* Blogs List */}
            {blogs.length > 0 ? (
                <>
                    <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
                        {blogs.map((blog) => (
                            <Link
                                key={blog.id}
                                href={`/content-engine/web-blogs/${blog.id}`}
                                className="flex items-start gap-4 p-4 hover:bg-neutral-50 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Newspaper className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
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
                                        {blog.category && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                                {blog.category}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-medium text-neutral-900 truncate">
                                        {blog.title || "Untitled"}
                                    </h3>
                                    {blog.description && (
                                        <p className="text-sm text-neutral-500 line-clamp-1 mt-0.5">
                                            {blog.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-3 mt-2">
                                        {blog.tags && blog.tags.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Tag className="w-3 h-3 text-neutral-400" />
                                                <span className="text-xs text-neutral-400">
                                                    {blog.tags.slice(0, 3).join(", ")}
                                                    {blog.tags.length > 3 && ` +${blog.tags.length - 3}`}
                                                </span>
                                            </div>
                                        )}
                                        <span className="text-xs text-neutral-400">
                                            Updated {formatRelativeTime(blog.updatedAt)}
                                        </span>
                                    </div>
                                </div>
                                <ArrowRight className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-2" />
                            </Link>
                        ))}
                    </div>

                    {/* Pagination */}
                    {total > limit && (
                        <div className="mt-6 flex items-center justify-center gap-2">
                            {currentPage > 1 && (
                                <Link
                                    href={`/content-engine/web-blogs?page=${currentPage - 1}${status ? `&status=${status}` : ""}${categoryFilter ? `&category=${categoryFilter}` : ""}`}
                                >
                                    <Button variant="outline" size="sm">
                                        Previous
                                    </Button>
                                </Link>
                            )}
                            <span className="text-sm text-neutral-600 px-4">
                                Page {currentPage} of {Math.ceil(total / limit)}
                            </span>
                            {pagination.hasMore && (
                                <Link
                                    href={`/content-engine/web-blogs?page=${currentPage + 1}${status ? `&status=${status}` : ""}${categoryFilter ? `&category=${categoryFilter}` : ""}`}
                                >
                                    <Button variant="outline" size="sm">
                                        Next
                                    </Button>
                                </Link>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                    <div className="w-16 h-16 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                        <Newspaper className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-neutral-900 mb-2">
                        {status === "draft"
                            ? "No draft blog posts"
                            : status === "published"
                                ? "No published blog posts"
                                : status === "archived"
                                    ? "No archived blog posts"
                                    : categoryFilter
                                        ? `No blog posts in "${categoryFilter}"`
                                        : "No blog posts yet"}
                    </h3>
                    <p className="text-sm text-neutral-600 mb-6 max-w-md mx-auto">
                        {categoryFilter
                            ? `You don't have any blog posts in this category.`
                            : "Create your first SEO-optimized blog post to drive organic traffic to your website."}
                    </p>
                    <div className="flex justify-center gap-3">
                        <Link href="/content-engine/web-blogs/new">
                            <Button>
                                <Sparkles className="w-4 h-4" />
                                Create with AI
                            </Button>
                        </Link>
                        <Link href="/content-engine/web-blogs/new?mode=manual">
                            <Button variant="outline">
                                <Plus className="w-4 h-4" />
                                Write Manually
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
