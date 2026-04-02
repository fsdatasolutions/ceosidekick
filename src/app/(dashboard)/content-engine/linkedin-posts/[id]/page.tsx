// src/app/(dashboard)/content-engine/linkedin-posts/[id]/page.tsx
// Content Engine - Edit LinkedIn Post

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Save,
  Loader2,
  Trash2,
  Clock,
  CheckCircle,
  Archive,
  RotateCcw,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Linkedin,
  Send,
  AlertTriangle,
  CalendarClock,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLinkedInStatus, useLinkedInOrgStatus, useLinkedInPost, useLinkedInSchedule } from "@/lib/hooks/useLinkedInStatus";

interface SchedulingMeta {
  postAs: string;
  visibility: "PUBLIC" | "CONNECTIONS";
  articleUrl?: string;
  articleTitle?: string;
  articleDescription?: string;
  linkedinPostId?: string;
  errorMessage?: string;
  retryCount?: number;
  lastAttemptAt?: string;
}

interface Post {
  id: string;
  content: string;
  status: string;
  linkedinPostType: string | null;
  heroImageId: string | null;
  authorName: string | null;
  authorRole: string | null;
  authorImageUrl: string | null;
  publishedAt: string | null;
  scheduledFor: string | null;
  schedulingMeta: SchedulingMeta | null;
  generatedFromPrompt: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // Post state
  const [post, setPost] = useState<Post | null>(null);
  const [content, setContent] = useState("");

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [copied, setCopied] = useState(false);

  // LinkedIn API
  const { status: linkedInStatus, loading: linkedInLoading } = useLinkedInStatus();
  const { status: linkedInOrgStatus } = useLinkedInOrgStatus();
  const { postToLinkedIn, posting: linkedInPosting, success: linkedInPostSuccess, error: linkedInPostError, reconnectRequired } = useLinkedInPost();
  const { schedulePost, cancelSchedule, scheduling, error: scheduleError } = useLinkedInSchedule();
  const [attachedUrl, setAttachedUrl] = useState("");
  const [postAs, setPostAs] = useState("personal");
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDateTime, setScheduledDateTime] = useState("");

  // Load post
  useEffect(() => {
    async function loadPost() {
      try {
        const response = await fetch(`/api/content/posts/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load post");
        }

        setPost(data.post);
        setContent(data.post.content || "");
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load post";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [id]);

  // Track changes
  useEffect(() => {
    if (post) {
      setHasChanges(content !== (post.content || ""));
    }
  }, [content, post]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/content/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save");
      }

      setPost((prev) => prev ? { ...prev, ...data.post } : null);
      setHasChanges(false);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    if (!post?.generatedFromPrompt) {
      setError("No original prompt to regenerate from");
      return;
    }

    setRegenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/content/posts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: post.generatedFromPrompt,
          postType: post.linkedinPostType || "insight",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Regeneration failed");
      }

      setContent(data.generated.content);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to regenerate";
      setError(errorMessage);
    } finally {
      setRegenerating(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/content/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      setPost((prev) => prev ? { ...prev, status: newStatus, publishedAt: data.post.publishedAt } : null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update status";
      setError(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this post? This cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/content/posts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete");
      }

      router.push("/content-engine/linkedin-posts");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete";
      setError(errorMessage);
      setDeleting(false);
    }
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || "Post not found"}
        </div>
        <Link href="/content-engine/linkedin-posts" className="mt-4 inline-block">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4" />
            Back to Posts
          </Button>
        </Link>
      </div>
    );
  }

  const charCount = content.length;
  const isOverLimit = charCount > 3000;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/content-engine/linkedin-posts" 
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Posts
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-neutral-900">
                  Edit Post
                </h1>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  post.status === "published"
                    ? "bg-green-100 text-green-700"
                    : post.status === "scheduled"
                      ? "bg-blue-100 text-blue-700"
                      : post.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : post.status === "archived"
                          ? "bg-neutral-100 text-neutral-500"
                          : "bg-amber-100 text-amber-700"
                }`}>
                  {post.status}
                </span>
              </div>
              <p className="text-neutral-600 text-sm">
                Last updated {new Date(post.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {post.status === "draft" && (
              <Button variant="outline" onClick={() => handleStatusChange("published")}>
                <CheckCircle className="w-4 h-4" />
                Mark Published
              </Button>
            )}
            {post.status === "scheduled" && (
              <Button
                variant="outline"
                onClick={async () => {
                  const result = await cancelSchedule(id);
                  if (result) {
                    setPost((prev) => prev ? { ...prev, status: "draft", scheduledFor: null, schedulingMeta: null } : null);
                    setShowScheduler(false);
                  }
                }}
                disabled={scheduling}
              >
                {scheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Cancel Schedule
              </Button>
            )}
            {post.status === "failed" && (
              <Button variant="outline" onClick={() => handleStatusChange("draft")}>
                <RotateCcw className="w-4 h-4" />
                Revert to Draft
              </Button>
            )}
            {post.status === "published" && (
              <Button variant="outline" onClick={() => handleStatusChange("archived")}>
                <Archive className="w-4 h-4" />
                Archive
              </Button>
            )}
            {post.status === "archived" && (
              <Button variant="outline" onClick={() => handleStatusChange("draft")}>
                <RotateCcw className="w-4 h-4" />
                Restore
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges || isOverLimit}
            >
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
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-neutral-700">
                    Post Content
                  </label>
                  <div className="flex items-center gap-3">
                    {post.generatedFromPrompt && (
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
                    <button
                      onClick={handleCopyContent}
                      className="text-xs text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <span className={`text-xs ${isOverLimit ? "text-red-600 font-medium" : "text-neutral-500"}`}>
                      {charCount}/3000
                    </span>
                  </div>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={18}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none text-sm ${
                    isOverLimit ? "border-red-300" : "border-neutral-300"
                  }`}
                />
                {isOverLimit && (
                  <p className="text-xs text-red-600 mt-1">
                    Post exceeds LinkedIn&apos;s 3000 character limit
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-xl border border-neutral-200 p-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-3">Preview</h3>
            <div className="p-4 bg-neutral-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                {post.authorImageUrl ? (
                  <img
                    src={post.authorImageUrl}
                    alt={post.authorName || "Author"}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-neutral-300" />
                )}
                <div>
                  <p className="text-sm font-medium text-neutral-900">{post.authorName || "Your Name"}</p>
                  <p className="text-xs text-neutral-500">{post.authorRole || "Your headline"} • Now</p>
                </div>
              </div>
              <div className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
                {content || "Your post content will appear here..."}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Post Info */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <h3 className="font-medium text-neutral-900 mb-3">Post Info</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-neutral-500">Status</dt>
                <dd className={`font-medium ${
                  post.status === "published" ? "text-green-600"
                  : post.status === "scheduled" ? "text-blue-600"
                  : post.status === "failed" ? "text-red-600"
                  : post.status === "archived" ? "text-neutral-500"
                  : "text-amber-600"
                }`}>
                  {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                </dd>
              </div>
              {post.linkedinPostType && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Type</dt>
                  <dd className="text-neutral-900">{post.linkedinPostType}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-neutral-500">Created</dt>
                <dd className="text-neutral-900">
                  {new Date(post.createdAt).toLocaleDateString()}
                </dd>
              </div>
              {post.scheduledFor && post.status === "scheduled" && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Scheduled</dt>
                  <dd className="text-blue-600 font-medium">
                    {new Date(post.scheduledFor).toLocaleString()}
                  </dd>
                </div>
              )}
              {post.publishedAt && (
                <div className="flex justify-between">
                  <dt className="text-neutral-500">Published</dt>
                  <dd className="text-neutral-900">
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Original Prompt */}
          {post.generatedFromPrompt && (
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
              <h3 className="font-medium text-neutral-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-sky-600" />
                Generated From
              </h3>
              <p className="text-sm text-neutral-600">
                {post.generatedFromPrompt}
              </p>
            </div>
          )}

          {/* Post to LinkedIn */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <h3 className="font-medium text-neutral-900 mb-3 flex items-center gap-2">
              <Linkedin className="w-4 h-4 text-[#0A66C2]" />
              Post to LinkedIn
            </h3>

            {/* Failed status — show error + retry/reschedule options */}
            {post.status === "failed" && post.schedulingMeta ? (
                <div className="space-y-2">
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 font-medium mb-1">
                      <AlertTriangle className="w-4 h-4" />
                      Publishing Failed
                    </div>
                    <p>{post.schedulingMeta.errorMessage || "Unknown error"}</p>
                    {post.schedulingMeta.retryCount && (
                        <p className="text-xs mt-1 text-red-500">
                          Attempted {post.schedulingMeta.retryCount} time{post.schedulingMeta.retryCount > 1 ? "s" : ""}
                        </p>
                    )}
                  </div>
                  <Button
                      className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white"
                      onClick={() => postToLinkedIn(content, {
                        ...(attachedUrl && { articleUrl: attachedUrl }),
                        postAs,
                      })}
                      disabled={linkedInPosting || !content.trim()}
                  >
                    {linkedInPosting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {linkedInPosting ? "Posting..." : "Retry Now"}
                  </Button>
                  <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => { setShowScheduler(true); handleStatusChange("draft"); }}
                  >
                    <CalendarClock className="w-4 h-4" />
                    Reschedule
                  </Button>
                </div>
            ) : post.status === "scheduled" ? (
                /* Scheduled status — show scheduled time + cancel */
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <CalendarClock className="w-4 h-4" />
                    <div>
                      <p className="font-medium">Scheduled</p>
                      <p className="text-xs">
                        {post.scheduledFor
                            ? new Date(post.scheduledFor).toLocaleString()
                            : "Unknown time"}
                      </p>
                    </div>
                  </div>
                  <Button
                      variant="outline"
                      className="w-full"
                      onClick={async () => {
                        const result = await cancelSchedule(id);
                        if (result) {
                          setPost((prev) => prev ? { ...prev, status: "draft", scheduledFor: null, schedulingMeta: null } : null);
                          setShowScheduler(false);
                        }
                      }}
                      disabled={scheduling}
                  >
                    {scheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    Cancel Schedule
                  </Button>
                  <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowScheduler(true)}
                  >
                    <CalendarClock className="w-4 h-4" />
                    Reschedule
                  </Button>
                  {showScheduler && (
                      <div className="space-y-2 pt-2 border-t border-neutral-100">
                        <div>
                          <label className="block text-xs text-neutral-500 mb-1">New date &amp; time</label>
                          <input
                              type="datetime-local"
                              value={scheduledDateTime}
                              onChange={(e) => setScheduledDateTime(e.target.value)}
                              className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                          />
                        </div>
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={scheduling || !scheduledDateTime}
                            onClick={async () => {
                              const result = await cancelSchedule(id);
                              if (result) {
                                const schedResult = await schedulePost(id, new Date(scheduledDateTime).toISOString(), { postAs, ...(attachedUrl && { articleUrl: attachedUrl }) });
                                if (schedResult) {
                                  setPost((prev) => prev ? { ...prev, ...schedResult.item } : null);
                                  setShowScheduler(false);
                                  setScheduledDateTime("");
                                }
                              }
                            }}
                        >
                          {scheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
                          Confirm Reschedule
                        </Button>
                      </div>
                  )}
                  {scheduleError && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                        {scheduleError}
                      </div>
                  )}
                </div>
            ) : linkedInLoading ? (
                <div className="flex items-center gap-2 text-sm text-neutral-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking connection...
                </div>
            ) : linkedInStatus?.connected && !linkedInStatus?.tokenExpired ? (
                <div className="space-y-2">
                  {linkedInPostSuccess ? (
                      <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                        <CheckCircle className="w-4 h-4" />
                        Posted to LinkedIn!
                      </div>
                  ) : (
                      <>
                        {/* Post as selector (personal + org pages) */}
                        {linkedInOrgStatus?.connected && linkedInOrgStatus.orgs && linkedInOrgStatus.orgs.length > 0 ? (
                            <div>
                              <label className="block text-xs text-neutral-500 mb-1">
                                Post as
                              </label>
                              <select
                                  value={postAs}
                                  onChange={(e) => setPostAs(e.target.value)}
                                  className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white"
                              >
                                <option value="personal">
                                  {linkedInStatus.profile?.name || "Personal Profile"}
                                </option>
                                {linkedInOrgStatus.orgs.map((org) => (
                                    <option key={org.id} value={org.id}>
                                      {org.vanityName || org.name}
                                    </option>
                                ))}
                              </select>
                            </div>
                        ) : linkedInOrgStatus?.connected && (!linkedInOrgStatus.orgs || linkedInOrgStatus.orgs.length === 0) ? (
                            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                              <p className="font-medium mb-1">No organization pages added</p>
                              <p className="text-amber-500">
                                Add a company page in{" "}
                                <Link href="/settings" className="underline hover:text-amber-700">Settings</Link> to post as your organization.
                              </p>
                            </div>
                        ) : null}
                        {/* Optional: Attach a blog/article link for a link-preview card */}
                        <div>
                          <label className="block text-xs text-neutral-500 mb-1">
                            Attach link (optional)
                          </label>
                          <input
                              type="url"
                              value={attachedUrl}
                              onChange={(e) => setAttachedUrl(e.target.value)}
                              placeholder="https://yourblog.com/post-slug"
                              className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                          />
                          {attachedUrl && (
                              <p className="text-xs text-neutral-400 mt-1">
                                Post will include a link preview card
                              </p>
                          )}
                        </div>
                        {/* Post Now button */}
                        <Button
                            className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white"
                            onClick={() => postToLinkedIn(content, {
                              ...(attachedUrl && { articleUrl: attachedUrl }),
                              postAs,
                            })}
                            disabled={linkedInPosting || !content.trim() || isOverLimit}
                        >
                          {linkedInPosting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                              <Send className="w-4 h-4" />
                          )}
                          {linkedInPosting ? "Posting..." : postAs !== "personal" ? `Post as ${linkedInOrgStatus?.orgs?.find(o => o.id === postAs)?.name || "Organization"}` : "Post to LinkedIn"}
                        </Button>
                        {/* Schedule for Later */}
                        {!showScheduler ? (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setShowScheduler(true)}
                            >
                              <CalendarClock className="w-4 h-4" />
                              Schedule for Later
                            </Button>
                        ) : (
                            <div className="space-y-2 pt-2 border-t border-neutral-100">
                              <div>
                                <label className="block text-xs text-neutral-500 mb-1">
                                  Date &amp; time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={scheduledDateTime}
                                    onChange={(e) => setScheduledDateTime(e.target.value)}
                                    className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                    disabled={scheduling || !scheduledDateTime || !content.trim()}
                                    onClick={async () => {
                                      const result = await schedulePost(id, new Date(scheduledDateTime).toISOString(), {
                                        postAs,
                                        ...(attachedUrl && { articleUrl: attachedUrl }),
                                      });
                                      if (result) {
                                        setPost((prev) => prev ? { ...prev, ...result.item } : null);
                                        setShowScheduler(false);
                                        setScheduledDateTime("");
                                      }
                                    }}
                                >
                                  {scheduling ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
                                  Schedule
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => { setShowScheduler(false); setScheduledDateTime(""); }}
                                >
                                  Cancel
                                </Button>
                              </div>
                              {scheduleError && (
                                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                                    {scheduleError}
                                  </div>
                              )}
                            </div>
                        )}
                      </>
                  )}
                  {linkedInPostError && (
                      <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                        {linkedInPostError}
                        {reconnectRequired && (
                            <a href="/api/linkedin/authorize" className="block mt-1 text-[#0A66C2] hover:underline font-medium">
                              Reconnect LinkedIn
                            </a>
                        )}
                      </div>
                  )}
                  <p className="text-xs text-neutral-500">
                    Connected as {linkedInStatus.profile?.name || "LinkedIn User"}
                  </p>
                </div>
            ) : linkedInStatus?.tokenExpired ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    Token expired
                  </div>
                  <a href="/api/linkedin/authorize">
                    <Button size="sm" className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white">
                      Reconnect LinkedIn
                    </Button>
                  </a>
                </div>
            ) : (
                <div className="space-y-2">
                  <p className="text-sm text-neutral-500">
                    Connect your LinkedIn account to post directly.
                  </p>
                  <Link href="/settings">
                    <Button variant="outline" size="sm" className="w-full">
                      <Linkedin className="w-4 h-4" />
                      Connect in Settings
                    </Button>
                  </Link>
                </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <h3 className="font-medium text-neutral-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleCopyContent}
              >
                <Copy className="w-4 h-4" />
                Copy to Clipboard
              </Button>
              <a
                href="https://www.linkedin.com/feed/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-start gap-2 w-full px-4 py-2 border border-neutral-200 rounded-lg text-sm hover:bg-neutral-50 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Open LinkedIn
              </a>
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
              Delete Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
