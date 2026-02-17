// src/app/(dashboard)/content-engine/linkedin-articles/[id]/page.tsx
// Content Engine - Edit LinkedIn Article

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Save,
  Loader2,
  Trash2,
  Clock,
  CheckCircle,
  Archive,
  History,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Linkedin,
  Send,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLinkedInStatus } from "@/lib/hooks/useLinkedInStatus";
import { useLinkedInPost } from "@/lib/hooks/useLinkedInStatus";

interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  status: string;
  heroImageId: string | null;
  authorName: string;
  authorRole: string;
  publishedAt: string | null;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Version {
  id: string;
  versionNumber: number;
  versionLabel: string | null;
  title: string | null;
  changeNotes: string | null;
  createdAt: string;
  isCurrent: boolean;
}

export default function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  // Article state
  const [article, setArticle] = useState<Article | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");

  // Version state
  const [versions, setVersions] = useState<Version[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [versionLabel, setVersionLabel] = useState("");
  const [changeNotes, setChangeNotes] = useState("");

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [copied, setCopied] = useState(false);

  // LinkedIn API
  const { status: linkedInStatus, loading: linkedInLoading } = useLinkedInStatus();
  const { postToLinkedIn, posting: linkedInPosting, success: linkedInPostSuccess, error: linkedInPostError, reconnectRequired } = useLinkedInPost();
  const [attachedUrl, setAttachedUrl] = useState("");

  /**
   * Strip markdown formatting for plain-text sharing on LinkedIn.
   */
  const stripMarkdown = (md: string): string => {
    return md
      .replace(/^---\n[\s\S]*?\n---\n*/m, '')
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/__(.+?)__/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      .replace(/^[-*_]{3,}\s*$/gm, '')
      .replace(/^\s*[-*]\s+/gm, '- ')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[LINK:\s*[^\]]+\]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
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

  const handlePostToLinkedIn = async () => {
    // Strip markdown and prepare clean text for LinkedIn
    const cleanContent = stripMarkdown(content);
    // LinkedIn post limit is ~3000 chars; use title + description as commentary for link posts
    let commentary: string;
    if (attachedUrl) {
      // Link-share: short commentary, let the card do the heavy lifting
      commentary = `${title}\n\n${description}`;
    } else {
      // Text post: include as much of the article as fits
      const fullText = `${title}\n\n${cleanContent}`;
      commentary = fullText.length > 2800
        ? `${fullText.substring(0, 2800)}...`
        : fullText;
    }

    await postToLinkedIn(commentary, {
      ...(attachedUrl && {
        articleUrl: attachedUrl,
        articleTitle: title,
        articleDescription: description,
      }),
    });
  };

  // Load article
  useEffect(() => {
    async function loadArticle() {
      try {
        const response = await fetch(`/api/content/articles/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load article");
        }

        setArticle(data.article);
        setTitle(data.article.title || "");
        setContent(data.article.content || "");
        setDescription(data.article.description || "");
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadArticle();
  }, [id]);

  // Load versions
  useEffect(() => {
    async function loadVersions() {
      try {
        const response = await fetch(`/api/content/articles/${id}/versions`);
        const data = await response.json();

        if (response.ok) {
          setVersions(data.versions || []);
        }
      } catch (err) {
        console.error("Failed to load versions:", err);
      }
    }

    if (showVersions) {
      loadVersions();
    }
  }, [id, showVersions]);

  // Track changes
  useEffect(() => {
    if (article) {
      const changed = 
        title !== (article.title || "") ||
        content !== (article.content || "") ||
        description !== (article.description || "");
      setHasChanges(changed);
    }
  }, [title, content, description, article]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/content/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save");
      }

      setArticle((prev) => prev ? { ...prev, ...data.article } : null);
      setHasChanges(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveVersion = async () => {
    setSavingVersion(true);
    setError(null);

    try {
      // First save current changes
      if (hasChanges) {
        await handleSave();
      }

      // Then create version
      const response = await fetch(`/api/content/articles/${id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionLabel: versionLabel.trim() || undefined,
          changeNotes: changeNotes.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save version");
      }

      // Refresh versions list
      setVersions((prev) => [
        { ...data.version, isCurrent: true },
        ...prev.map((v) => ({ ...v, isCurrent: false })),
      ]);
      setVersionLabel("");
      setChangeNotes("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSavingVersion(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!confirm("Restore this version? Current unsaved changes will be lost.")) {
      return;
    }

    try {
      const response = await fetch(`/api/content/articles/${id}/versions/${versionId}/restore`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to restore version");
      }

      // Update article with restored content
      setTitle(data.article.title || "");
      setContent(data.article.content || "");
      setDescription(data.article.description || "");
      setHasChanges(false);

      // Refresh versions
      const versionsResponse = await fetch(`/api/content/articles/${id}/versions`);
      const versionsData = await versionsResponse.json();
      if (versionsResponse.ok) {
        setVersions(versionsData.versions || []);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/content/articles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update status");
      }

      setArticle((prev) => prev ? { ...prev, status: newStatus } : null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this article? This cannot be undone.")) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/content/articles/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete");
      }

      router.push("/content-engine/linkedin-articles");
    } catch (err: any) {
      setError(err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error || "Article not found"}
        </div>
        <Link href="/content-engine/linkedin-articles" className="mt-4 inline-block">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4" />
            Back to Articles
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link 
          href="/content-engine/linkedin-articles" 
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Articles
        </Link>
        
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-neutral-900">
                  Edit Article
                </h1>
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
              <p className="text-neutral-600 text-sm">
                Last updated {new Date(article.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {article.status === "draft" && (
              <Button variant="outline" onClick={() => handleStatusChange("published")}>
                <CheckCircle className="w-4 h-4" />
                Publish
              </Button>
            )}
            {article.status === "published" && (
              <Button variant="outline" onClick={() => handleStatusChange("archived")}>
                <Archive className="w-4 h-4" />
                Archive
              </Button>
            )}
            {article.status === "archived" && (
              <Button variant="outline" onClick={() => handleStatusChange("draft")}>
                <RotateCcw className="w-4 h-4" />
                Restore to Draft
              </Button>
            )}
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
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
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Article title..."
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-lg font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary..."
                  rows={2}
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your article..."
                  rows={24}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Version History */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <button
              onClick={() => setShowVersions(!showVersions)}
              className="w-full flex items-center justify-between text-left"
            >
              <h3 className="font-medium text-neutral-900 flex items-center gap-2">
                <History className="w-4 h-4" />
                Version History
              </h3>
              {showVersions ? (
                <ChevronUp className="w-4 h-4 text-neutral-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-neutral-500" />
              )}
            </button>

            {showVersions && (
              <div className="mt-4 space-y-4">
                {/* Save New Version */}
                <div className="p-3 bg-neutral-50 rounded-lg space-y-2">
                  <input
                    type="text"
                    value={versionLabel}
                    onChange={(e) => setVersionLabel(e.target.value)}
                    placeholder="Version label (e.g., Final Draft)"
                    className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <textarea
                    value={changeNotes}
                    onChange={(e) => setChangeNotes(e.target.value)}
                    placeholder="What changed?"
                    rows={2}
                    className="w-full px-3 py-1.5 text-sm border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveVersion}
                    disabled={savingVersion}
                    className="w-full"
                  >
                    {savingVersion ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    Save Version
                  </Button>
                </div>

                {/* Version List */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {versions.length > 0 ? (
                    versions.map((version) => (
                      <div
                        key={version.id}
                        className={`p-3 rounded-lg border ${
                          version.isCurrent 
                            ? "border-blue-200 bg-blue-50" 
                            : "border-neutral-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-neutral-900">
                              {version.versionLabel || `Version ${version.versionNumber}`}
                              {version.isCurrent && (
                                <span className="ml-2 text-xs text-blue-600">(current)</span>
                              )}
                            </p>
                            {version.changeNotes && (
                              <p className="text-xs text-neutral-500 mt-0.5">
                                {version.changeNotes}
                              </p>
                            )}
                            <p className="text-xs text-neutral-400 mt-1">
                              {new Date(version.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {!version.isCurrent && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRestoreVersion(version.id)}
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-neutral-500 text-center py-4">
                      No versions saved yet
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Share on LinkedIn */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <h3 className="font-medium text-neutral-900 mb-3 flex items-center gap-2">
              <Linkedin className="w-4 h-4 text-[#0A66C2]" />
              Share on LinkedIn
            </h3>

            {linkedInLoading ? (
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking connection...
              </div>
            ) : linkedInStatus?.connected && !linkedInStatus?.tokenExpired ? (
              <div className="space-y-2">
                {linkedInPostSuccess ? (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg border border-green-200">
                    <CheckCircle className="w-4 h-4" />
                    Shared on LinkedIn!
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-neutral-500 mb-2">
                      Share as a LinkedIn post. Attach a link to create a preview card.
                    </p>
                    <div>
                      <label className="block text-xs text-neutral-500 mb-1">
                        Attach link (optional)
                      </label>
                      <input
                        type="url"
                        value={attachedUrl}
                        onChange={(e) => setAttachedUrl(e.target.value)}
                        placeholder="https://yourblog.com/article-slug"
                        className="w-full px-3 py-1.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                      {attachedUrl && (
                        <p className="text-xs text-neutral-400 mt-1">
                          Post will include a link preview card
                        </p>
                      )}
                    </div>
                    <Button
                      className="w-full bg-[#0A66C2] hover:bg-[#004182] text-white"
                      onClick={handlePostToLinkedIn}
                      disabled={linkedInPosting || !content.trim()}
                    >
                      {linkedInPosting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {linkedInPosting ? "Posting..." : "Share on LinkedIn"}
                    </Button>
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
                  Connect your LinkedIn account to share directly.
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
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Content"}
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
              Delete Article
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
