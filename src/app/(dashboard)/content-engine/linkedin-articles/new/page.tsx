// src/app/(dashboard)/content-engine/linkedin-articles/new/page.tsx
// Content Engine - Create New LinkedIn Article

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Save,
  Loader2,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewArticlePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "ai"; // 'ai' or 'manual'

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");

  // AI generation state
  const [topic, setTopic] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [tone, setTone] = useState("professional");

  // UI state
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(mode === "manual");

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/content/articles/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          targetAudience: targetAudience.trim() || undefined,
          keyPoints: keyPoints.trim() 
            ? keyPoints.split("\n").filter(p => p.trim()) 
            : undefined,
          tone,
          includeCallToAction: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      // Populate the editor with generated content
      setTitle(data.generated.title);
      setContent(data.generated.content);
      setDescription(data.generated.description);
      setShowEditor(true);
    } catch (err: any) {
      setError(err.message || "Failed to generate article");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/content/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          description: description.trim() || undefined,
          generatedFromPrompt: topic.trim() || undefined,
          aiModel: topic.trim() ? "claude-sonnet-4-20250514" : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save article");
      }

      // Redirect to the article editor
      router.push(`/content-engine/linkedin-articles/${data.article.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/content-engine/linkedin-articles" 
          className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Articles
        </Link>
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-neutral-900">
              {showEditor ? "Edit Article" : "Create New Article"}
            </h1>
            <p className="text-neutral-600">
              {showEditor 
                ? "Review and edit your article before saving" 
                : "Generate with AI or write from scratch"
              }
            </p>
          </div>
        </div>
      </div>

      {/* Mode Toggle (only show if not in editor mode) */}
      {!showEditor && (
        <div className="mb-6">
          <div className="flex rounded-lg border border-neutral-200 overflow-hidden w-fit">
            <Link
              href="/content-engine/linkedin-articles/new"
              className={`px-4 py-2 text-sm flex items-center gap-2 ${
                mode === "ai" 
                  ? "bg-blue-50 text-blue-700 font-medium" 
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Generate with AI
            </Link>
            <Link
              href="/content-engine/linkedin-articles/new?mode=manual"
              className={`px-4 py-2 text-sm border-l border-neutral-200 flex items-center gap-2 ${
                mode === "manual" 
                  ? "bg-blue-50 text-blue-700 font-medium" 
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <FileText className="w-4 h-4" />
              Write Manually
            </Link>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* AI Generation Form */}
      {!showEditor && mode === "ai" && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6">
          <h2 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-blue-600" />
            AI Article Generator
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Topic / Main Idea <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., The Future of Remote Work in 2025"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
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
                placeholder="e.g., Tech executives, startup founders, HR professionals"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Key Points to Cover
                <span className="text-neutral-400 font-normal"> (one per line, optional)</span>
              </label>
              <textarea
                value={keyPoints}
                onChange={(e) => setKeyPoints(e.target.value)}
                placeholder="Productivity benefits&#10;Challenges of hybrid teams&#10;Tools and technologies"
                rows={4}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Tone
              </label>
              <div className="flex gap-2">
                {["professional", "conversational", "thought-provoking", "inspiring"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-3 py-1.5 text-sm rounded-lg border capitalize ${
                      tone === t
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={handleGenerate}
                disabled={generating || !topic.trim()}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Article...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Article
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
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter article title..."
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-lg font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Description
                <span className="text-neutral-400 font-normal"> (appears in previews)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of your article..."
                rows={2}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Content
                <span className="text-neutral-400 font-normal"> (Markdown supported)</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your article content here...&#10;&#10;Use Markdown for formatting:&#10;# Heading 1&#10;## Heading 2&#10;**bold** and *italic*&#10;- bullet points"
                rows={20}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none font-mono text-sm"
              />
            </div>

            <div className="flex justify-between pt-4 border-t border-neutral-200">
              {showEditor && mode !== "manual" && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditor(false);
                    setTitle("");
                    setContent("");
                    setDescription("");
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Generator
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Link href="/content-engine/linkedin-articles">
                  <Button variant="outline">Cancel</Button>
                </Link>
                <Button
                  onClick={handleSave}
                  disabled={saving || !title.trim()}
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
