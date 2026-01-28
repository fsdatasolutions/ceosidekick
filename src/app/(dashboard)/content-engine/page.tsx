// src/app/(dashboard)/content-engine/page.tsx
// Content Engine Dashboard - Main entry point with tabbed navigation

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Image as ImageIcon,
  FileText,
  MessageSquare,
  Newspaper,
  ArrowRight,
  Sparkles,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserUsage } from "@/lib/usage";
import { getContentStats } from "@/lib/services/content-stats";

// Tab configuration
const tabs = [
  {
    id: "images",
    name: "Images",
    description: "Upload or generate AI images",
    icon: ImageIcon,
    href: "/content-engine/images",
    color: "bg-violet-100 text-violet-600",
  },
  {
    id: "linkedin-articles",
    name: "LinkedIn Articles",
    description: "Long-form professional content",
    icon: FileText,
    href: "/content-engine/linkedin-articles",
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "linkedin-posts",
    name: "LinkedIn Posts",
    description: "Short-form social updates",
    icon: MessageSquare,
    href: "/content-engine/linkedin-posts",
    color: "bg-sky-100 text-sky-600",
  },
  {
    id: "web-blogs",
    name: "Web Blogs",
    description: "Articles for your website",
    icon: Newspaper,
    href: "/content-engine/web-blogs",
    color: "bg-emerald-100 text-emerald-600",
  },
];

export default async function ContentEnginePage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const firstName = session.user.name?.split(" ")[0] || "there";

  // Fetch usage and content stats in parallel
  const [usageData, contentStats] = await Promise.all([
    getUserUsage(userId),
    getContentStats(userId),
  ]);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-red to-amber-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-neutral-900">
              Content Engine
            </h1>
            <p className="text-neutral-600">
              Create and manage your marketing content with AI
            </p>
          </div>
        </div>
      </div>

      {/* Credits Banner */}
      <div className="mb-8 p-4 bg-white rounded-xl border border-neutral-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-600">
              <span className="font-semibold text-neutral-900">{usageData.remaining}</span>
              {" "}credits remaining this month
            </div>
            <div className="h-4 w-px bg-neutral-200" />
            <div className="text-sm text-neutral-500">
              {usageData.messagesUsed} / {usageData.totalAvailable} used
            </div>
          </div>
          <Link href="/pricing">
            <Button variant="outline" size="sm">
              Get More Credits
            </Button>
          </Link>
        </div>
        {/* Progress bar */}
        <div className="mt-3 w-full bg-neutral-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              usageData.status === "exceeded" ? "bg-red-500" :
              usageData.status === "critical" ? "bg-red-500" :
              usageData.status === "warning" ? "bg-amber-500" :
              "bg-primary-red"
            }`}
            style={{ width: `${Math.min(usageData.percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{contentStats.images}</p>
              <p className="text-sm text-neutral-500">Images</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{contentStats.linkedinArticles}</p>
              <p className="text-sm text-neutral-500">Articles</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{contentStats.linkedinPosts}</p>
              <p className="text-sm text-neutral-500">Posts</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{contentStats.webBlogs}</p>
              <p className="text-sm text-neutral-500">Blogs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="mb-8">
        <h2 className="font-display text-xl font-semibold text-neutral-900 mb-4">
          Create Content
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className="group bg-white rounded-xl border border-neutral-200 p-5 hover:border-neutral-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg ${tab.color} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 group-hover:text-primary-red transition-colors mb-1">
                      {tab.name}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {tab.description}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-red group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Create Campaign CTA */}
      <div className="mb-8 p-6 bg-gradient-to-r from-primary-red/10 to-amber-500/10 border border-primary-red/20 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-red to-amber-500 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-neutral-900">
                Create Content Campaign
              </h3>
              <p className="text-neutral-600">
                Enter your brief once, generate images, articles, posts, and blogs together
              </p>
            </div>
          </div>
          <Link href="/content-engine/create">
            <Button size="lg">
              <Sparkles className="w-4 h-4" />
              Start Creating
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="font-display text-xl font-semibold text-neutral-900 mb-4">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/content-engine/create">
            <Button>
              <Sparkles className="w-4 h-4" />
              Create Campaign
            </Button>
          </Link>
          <Link href="/content-engine/images?action=generate">
            <Button variant="outline">
              <Plus className="w-4 h-4" />
              Generate Image
            </Button>
          </Link>
          <Link href="/content-engine/images?action=upload">
            <Button variant="outline">
              <Plus className="w-4 h-4" />
              Upload Image
            </Button>
          </Link>
          <Link href="/content-engine/linkedin-articles/new">
            <Button variant="outline">
              <FileText className="w-4 h-4" />
              New Article
            </Button>
          </Link>
        </div>
      </div>

      {/* Recent Content */}
      {contentStats.recentContent.length > 0 && (
        <div>
          <h2 className="font-display text-xl font-semibold text-neutral-900 mb-4">
            Recent Content
          </h2>
          <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
            {contentStats.recentContent.map((item) => {
              const tabConfig = tabs.find(t => 
                (item.type === "linkedin_article" && t.id === "linkedin-articles") ||
                (item.type === "linkedin_post" && t.id === "linkedin-posts") ||
                (item.type === "web_blog" && t.id === "web-blogs")
              );
              const Icon = tabConfig?.icon || FileText;
              const colorClass = tabConfig?.color || "bg-neutral-100 text-neutral-600";
              
              return (
                <Link
                  key={item.id}
                  href={`/content-engine/${tabConfig?.id || "web-blogs"}/${item.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors"
                >
                  <div className={`w-10 h-10 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-neutral-900 truncate">
                        {item.title || "Untitled"}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.status === "published" 
                          ? "bg-green-100 text-green-700" 
                          : "bg-neutral-100 text-neutral-600"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-500">
                      {item.type.replace("_", " ")} • Updated {formatRelativeTime(item.updatedAt)}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {contentStats.total === 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-red/10 to-amber-500/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-primary-red" />
          </div>
          <h3 className="font-semibold text-neutral-900 mb-2">Create Your First Content</h3>
          <p className="text-sm text-neutral-600 mb-6 max-w-md mx-auto">
            Start by generating an AI image or creating a LinkedIn post. Your content will appear here.
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/content-engine/images?action=generate">
              <Button>
                <Sparkles className="w-4 h-4" />
                Generate AI Image
              </Button>
            </Link>
            <Link href="/content-engine/linkedin-posts/new">
              <Button variant="outline">
                <MessageSquare className="w-4 h-4" />
                Create Post
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
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
