// src/app/(dashboard)/content-engine/images/components/image-generate-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModelOption {
  id: string;
  name: string;
  description: string;
  sizes: {
    value: string;
    label: string;
    credits: number | { standard: number; hd: number };
  }[];
  supportsQuality: boolean;
  supportsStyle: boolean;
  qualityOptions?: { value: string; label: string }[];
  styleOptions?: { value: string; label: string }[];
}

export function ImageGenerateModal() {
  const router = useRouter();
  const [options, setOptions] = useState<{ models: ModelOption[] } | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  
  // Form state
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("dall-e-3");
  const [size, setSize] = useState("1024x1024");
  const [quality, setQuality] = useState("standard");
  const [style, setStyle] = useState("vivid");
  const [name, setName] = useState("");
  
  // UI state
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<{ url: string; creditsUsed: number } | null>(null);

  // Fetch available options on mount
  useEffect(() => {
    async function fetchOptions() {
      try {
        const response = await fetch("/api/content/images/generate");
        const data = await response.json();
        setOptions(data);
      } catch (err) {
        console.error("Failed to fetch options:", err);
      } finally {
        setLoadingOptions(false);
      }
    }
    fetchOptions();
  }, []);

  const handleClose = () => {
    router.push("/content-engine/images");
  };

  const selectedModel = options?.models.find(m => m.id === model);
  const selectedSize = selectedModel?.sizes.find(s => s.value === size);
  
  // Calculate credits
  const getCredits = (): number => {
    if (!selectedSize) return 0;
    if (typeof selectedSize.credits === "number") {
      return selectedSize.credits;
    }
    return selectedSize.credits[quality as "standard" | "hd"] || 0;
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/content/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model,
          size,
          quality: selectedModel?.supportsQuality ? quality : undefined,
          style: selectedModel?.supportsStyle ? style : undefined,
          name: name.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setSuccess(true);
      setGeneratedImage({
        url: data.image.url,
        creditsUsed: data.creditsUsed,
      });

      setTimeout(() => {
        router.push("/content-engine/images");
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to generate image");
    } finally {
      setGenerating(false);
    }
  };

  // Reset size when model changes
  useEffect(() => {
    if (selectedModel) {
      setSize(selectedModel.sizes[0]?.value || "1024x1024");
    }
  }, [model]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                Generate AI Image
              </h2>
              <p className="text-sm text-neutral-500">
                Powered by DALL-E
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loadingOptions ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
          ) : success && generatedImage ? (
            <div className="text-center py-4">
              <div className="relative aspect-square max-w-sm mx-auto rounded-xl overflow-hidden mb-4 bg-neutral-100">
                <img
                  src={generatedImage.url}
                  alt="Generated image"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Image Generated!
              </h3>
              <p className="text-neutral-600">
                {generatedImage.creditsUsed} credit{generatedImage.creditsUsed !== 1 ? "s" : ""} used
              </p>
            </div>
          ) : (
            <>
              {/* Prompt Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Describe your image
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A professional business meeting in a modern glass office with city skyline views..."
                  rows={4}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none"
                  maxLength={4000}
                />
                <div className="flex justify-between mt-1">
                  <p className="text-xs text-neutral-400">
                    Be descriptive for better results
                  </p>
                  <p className="text-xs text-neutral-400">
                    {prompt.length}/4000
                  </p>
                </div>
              </div>

              {/* Model Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Model
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {options?.models.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        model === m.id
                          ? "border-violet-500 bg-violet-50 ring-2 ring-violet-500/20"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                    >
                      <p className="font-medium text-neutral-900">{m.name}</p>
                      <p className="text-xs text-neutral-500 mt-1">{m.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedModel?.sizes.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSize(s.value)}
                      className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                        size === s.value
                          ? "border-violet-500 bg-violet-50 text-violet-700 font-medium"
                          : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality (DALL-E 3 only) */}
              {selectedModel?.supportsQuality && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Quality
                  </label>
                  <div className="flex gap-2">
                    {selectedModel.qualityOptions?.map((q) => (
                      <button
                        key={q.value}
                        onClick={() => setQuality(q.value)}
                        className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                          quality === q.value
                            ? "border-violet-500 bg-violet-50 text-violet-700 font-medium"
                            : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                        }`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Style (DALL-E 3 only) */}
              {selectedModel?.supportsStyle && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Style
                  </label>
                  <div className="flex gap-2">
                    {selectedModel.styleOptions?.map((s) => (
                      <button
                        key={s.value}
                        onClick={() => setStyle(s.value)}
                        className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                          style === s.value
                            ? "border-violet-500 bg-violet-50 text-violet-700 font-medium"
                            : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Image Name
                  <span className="text-neutral-400 font-normal"> (optional)</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My AI Image"
                  className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>

              {/* Credit Info */}
              <div className="mb-6 p-4 bg-violet-50 rounded-xl border border-violet-100">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-violet-900">
                      This will use {getCredits()} credit{getCredits() !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-violet-700 mt-1">
                      {model === "dall-e-3" 
                        ? "DALL-E 3 provides higher quality and better prompt understanding"
                        : "DALL-E 2 is faster and uses fewer credits"
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={generating || !prompt.trim()}
                  className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Generate ({getCredits()} Credit{getCredits() !== 1 ? "s" : ""})
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
