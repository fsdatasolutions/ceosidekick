// src/app/(dashboard)/content-engine/linkedin-posts/new/page.tsx
// Content Engine - Create New LinkedIn Post

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  MessageSquare,
  Sparkles,
  Save,
  Loader2,
  Wand2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const POST_TYPES = [
  { value: "insight", label: "Insight", description: "Industry observation or trend" },
  { value: "story", label: "Story", description: "Personal experience with a lesson" },
  { value: "tips", label: "Tips", description: "Actionable advice list" },
  { value: "question", label: "Question", description: "Thought-provoking engagement" },
  { value: "celebration", label: "Celebration", description: "Achievement or milestone" },
  { value: "behind-the-scenes", label: "Behind the Scenes", description: "Authentic peek into work" },
];

const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "conversational", label: "Conversational" },
  { value: "inspiring", label: "Inspiring" },
  { value: "educational", label: "Educational" },
  { value: "humorous", label: "Humorous" },
];

export default function NewPostPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "ai";
  const fromArticle = searchParams.get("fromArticle");

  // Form state
  const [content, setContent] = useState("");

  // AI generation state
  const [topic, setTopic] = useState("");
  const [postType, setPostType] = useState("insight");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("professional");

  // Article state (if deriving from article)
  const [articleTitle, setArticleTitle] = useState("");
  const [articleContent, setArticleContent] = useState("");

  // UI state
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(mode === "manual");
  const [copied, setCopied] = useState(false);

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
        setTopic(`Promote article: ${data.article.title}`);
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
      const response = await fetch("/api/content/posts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          postType,
          targetAudience: targetAudience.trim() || undefined,
          tone,
          articleContent: articleContent || undefined,
          articleTitle: articleTitle || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setContent(data.generated.content);
      setShowEditor(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to generate post";
      setError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      setError("Please enter content");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/content/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          linkedinPostType: postType,
          generatedFromPrompt: topic.trim() || undefined,
          aiModel: topic.trim() ? "claude-sonnet-4-20250514" : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save post");
      }

      router.push(`/content-engine/linkedin-posts/${data.post.id}`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save post";
      setError(errorMessage);
    } finally {
      setSaving(false);
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

  const charCount = content.length;
  const isOverLimit = charCount > 3000;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/content-engine/linkedin-posts" 
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Posts
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-neutral-900">
              {showEditor ? "Edit Post" : "Create New Post"}
            </h1>
            <p className="text-neutral-600">
              {showEditor 
                ? "Review and edit your post before saving" 
                : fromArticle 
                  ? "Create a post to promote your article"
                  : "Generate with AI or write from scratch"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Mode Toggle (only show if not in editor mode and not from article) */}
      {!showEditor && !fromArticle && (
        <div className="mb-6">
          <div className="flex rounded-lg border border-neutral-200 overflow-hidden w-fit">
            <Link
              href="/content-engine/linkedin-posts/new"
              className={`px-4 py-2 text-sm flex items-center gap-2 ${
                mode === "ai" 
                  ? "bg-sky-50 text-sky-700 font-medium" 
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Generate with AI
            </Link>
            <Link
              href="/content-engine/linkedin-posts/new?mode=manual"
              className={`px-4 py-2 text-sm border-l border-neutral-200 flex items-center gap-2 ${
                mode === "manual" 
                  ? "bg-sky-50 text-sky-700 font-medium" 
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
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
            <Wand2 className="w-5 h-5 text-sky-600" />
            {fromArticle ? "Generate Post from Article" : "AI Post Generator"}
          </h2>
          
          <div className="space-y-4">
            {fromArticle && articleTitle && (
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg">
                <p className="text-sm text-sky-700">
                  <strong>Article:</strong> {articleTitle}
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                {fromArticle ? "Additional Context" : "Topic / Main Idea"} 
                {!fromArticle && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={fromArticle 
                  ? "Any specific angle or CTA to emphasize?" 
                  : "e.g., Why most startups fail in year one"
                }
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Post Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {POST_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setPostType(type.value)}
                    className={`p-3 text-left rounded-lg border transition-colors ${
                      postType === type.value
                        ? "border-sky-500 bg-sky-50"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <p className={`text-sm font-medium ${
                      postType === type.value ? "text-sky-700" : "text-neutral-900"
                    }`}>
                      {type.label}
                    </p>
                    <p className="text-xs text-neutral-500">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Target Audience
                <span className="text-neutral-400 font-normal"> (optional)</span>
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g., Startup founders, sales professionals"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>

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
                        ? "border-sky-500 bg-sky-50 text-sky-700 font-medium"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
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
                    Generating Post...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Manual / Editor Form */}
      {(showEditor || mode === "manual") && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-neutral-700">
                  Post Content
                </label>
                <div className="flex items-center gap-2">
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
                placeholder="Write your LinkedIn post here...&#10;&#10;Tips:&#10;• Start with a hook&#10;• Use line breaks for readability&#10;• End with a question or CTA&#10;• Add 3-5 hashtags"
                rows={15}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none text-sm ${
                  isOverLimit ? "border-red-300" : "border-neutral-300"
                }`}
              />
              {isOverLimit && (
                <p className="text-xs text-red-600 mt-1">
                  Post exceeds LinkedIn's 3000 character limit
                </p>
              )}
            </div>

            {/* Preview */}
            <div className="border-t border-neutral-200 pt-4">
              <h3 className="text-sm font-medium text-neutral-700 mb-2">Preview</h3>
              <div className="p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-300" />
                  <div>
                    <p className="text-sm font-medium text-neutral-900">Your Name</p>
                    <p className="text-xs text-neutral-500">Your headline • Now</p>
                  </div>
                </div>
                <div className="text-sm text-neutral-700 whitespace-pre-wrap">
                  {content || "Your post content will appear here..."}
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-neutral-200">
              {showEditor && mode !== "manual" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditor(false);
                    setContent("");
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Generator
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Link href="/content-engine/linkedin-posts">
                  <Button variant="outline">Cancel</Button>
                </Link>
                <Button
                  onClick={handleSave}
                  disabled={saving || !content.trim() || isOverLimit}
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
          </div>
        </div>
      )}
    </div>
  );
}
