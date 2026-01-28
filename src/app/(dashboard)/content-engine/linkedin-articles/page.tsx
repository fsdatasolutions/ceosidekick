// src/app/(dashboard)/content-engine/linkedin-articles/page.tsx
// Content Engine - LinkedIn Articles List

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Plus,
  Sparkles,
  Clock,
  CheckCircle,
  Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { listContentItems } from "@/lib/services/content-items";

interface PageProps {
  searchParams: Promise<{
    status?: string;
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

export default async function LinkedInArticlesPage({ searchParams }: PageProps) {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const params = await searchParams;
  const status = params.status as "draft" | "published" | "archived" | undefined;
  const currentPage = parseInt(params.page || "1", 10);
  const limit = 20;
  const offset = (currentPage - 1) * limit;

  // Fetch articles
  let articles: any[] = [];
  let pagination = { total: 0, limit, offset, hasMore: false };

  try {
    const result = await listContentItems({
      userId,
      type: "linkedin_article",
      status,
      limit,
      offset,
    });
    articles = result.items;
    pagination = result.pagination;
  } catch (error) {
    console.error("Failed to fetch articles:", error);
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
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-neutral-900">
                LinkedIn Articles
              </h1>
              <p className="text-neutral-600">
                Create and manage long-form professional content
              </p>
            </div>
          </div>
          
          <Link href="/content-engine/linkedin-articles/new">
            <Button>
              <Plus className="w-4 h-4" />
              New Article
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">Status:</span>
          <div className="flex rounded-lg border border-neutral-200 overflow-hidden">
            <Link
              href="/content-engine/linkedin-articles"
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 ${
                !status 
                  ? "bg-neutral-100 text-neutral-900 font-medium" 
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              All
            </Link>
            <Link
              href="/content-engine/linkedin-articles?status=draft"
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
              href="/content-engine/linkedin-articles?status=published"
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
              href="/content-engine/linkedin-articles?status=archived"
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
        
        <div className="text-sm text-neutral-500">
          {total} article{total !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Articles List */}
      {articles.length > 0 ? (
        <>
          <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/content-engine/linkedin-articles/${article.id}`}
                className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-neutral-900 truncate">
                      {article.title || "Untitled Article"}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      article.status === "published" 
                        ? "bg-green-100 text-green-700" 
                        : article.status === "archived"
                          ? "bg-neutral-100 text-neutral-500"
                          : "bg-amber-100 text-amber-700"
                    }`}>
                      {article.status}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-500 truncate">
                    {article.description || "No description"}
                  </p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Updated {formatRelativeTime(article.updatedAt)}
                    {article.publishedAt && ` • Published ${formatRelativeTime(article.publishedAt)}`}
                  </p>
                </div>
                <ArrowRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="mt-6 flex items-center justify-center gap-2">
              {currentPage > 1 && (
                <Link href={`/content-engine/linkedin-articles?page=${currentPage - 1}${status ? `&status=${status}` : ""}`}>
                  <Button variant="outline" size="sm">
                    Previous
                  </Button>
                </Link>
              )}
              <span className="text-sm text-neutral-600 px-4">
                Page {currentPage} of {Math.ceil(total / limit)}
              </span>
              {pagination.hasMore && (
                <Link href={`/content-engine/linkedin-articles?page=${currentPage + 1}${status ? `&status=${status}` : ""}`}>
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
          <div className="w-16 h-16 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="font-semibold text-neutral-900 mb-2">
            {status === "draft" 
              ? "No draft articles" 
              : status === "published" 
                ? "No published articles"
                : status === "archived"
                  ? "No archived articles"
                  : "No articles yet"
            }
          </h3>
          <p className="text-sm text-neutral-600 mb-6 max-w-md mx-auto">
            {status 
              ? `You don't have any ${status} articles.`
              : "Create your first LinkedIn article to establish thought leadership and engage your professional network."
            }
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/content-engine/linkedin-articles/new">
              <Button>
                <Sparkles className="w-4 h-4" />
                Create with AI
              </Button>
            </Link>
            <Link href="/content-engine/linkedin-articles/new?mode=manual">
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
