// src/app/(dashboard)/content-engine/images/page.tsx
// Content Engine - Images Tab
// Upload images or generate AI images with DALL-E

import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageGallery } from "./components/image-gallery";
import { ImageUploadModal } from "./components/image-upload-modal";
import { ImageGenerateModal } from "./components/image-generate-modal";

interface PageProps {
  searchParams: Promise<{
    action?: string;
    source?: string;
    page?: string;
  }>;
}

// Safe function to get images - handles missing tables gracefully
async function getImages(userId: string, source?: string, limit = 20, offset = 0) {
  try {
    const { listContentImages } = await import("@/lib/services/content-images");
    const result = await listContentImages({
      userId,
      source: source as "upload" | "dalle" | undefined,
      limit,
      offset,
    });
    return result;
  } catch (error) {
    console.error("[Images Page] Failed to fetch images:", error);
    // Return empty state if table doesn't exist or other error
    return {
      images: [],
      pagination: {
        total: 0,
        limit,
        offset,
        hasMore: false,
      },
    };
  }
}

export default async function ImagesPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;
  const params = await searchParams;
  const { action, source, page } = params;

  const currentPage = parseInt(page || "1", 10);
  const limit = 20;
  const offset = (currentPage - 1) * limit;

  // Fetch images with error handling
  const result = await getImages(userId, source, limit, offset);
  const images = result.images ?? [];
  const pagination = result.pagination ?? { total: 0, limit, offset, hasMore: false };

  const showUploadModal = action === "upload";
  const showGenerateModal = action === "generate";

  // Safely access pagination values with defaults
  const total = pagination.total ?? 0;
  const hasMore = pagination.hasMore ?? false;

  // Transform images to match the expected interface for ImageGallery
  const transformedImages = images.map((img) => ({
    id: img.id,
    name: img.name,
    url: img.gcsUrl, // Map gcsUrl to url
    mimeType: img.mimeType,
    size: img.size,
    width: img.width ?? undefined,
    height: img.height ?? undefined,
    source: img.source,
    prompt: img.generatedFromPrompt ?? undefined,
    altText: img.altText ?? undefined,
    usageCount: img.usageCount ?? 0,
    createdAt: img.createdAt.toISOString(),
  }));

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
              <div className="w-12 h-12 rounded-lg bg-violet-100 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-neutral-900">
                  Images
                </h1>
                <p className="text-neutral-600">
                  Upload images or generate with AI
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Link href="/content-engine/images?action=upload">
                <Button variant="outline">
                  <Upload className="w-4 h-4" />
                  Upload
                </Button>
              </Link>
              <Link href="/content-engine/images?action=generate">
                <Button>
                  <Sparkles className="w-4 h-4" />
                  Generate with AI
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500">Filter:</span>
            <div className="flex rounded-lg border border-neutral-200 overflow-hidden">
              <Link
                  href="/content-engine/images"
                  className={`px-3 py-1.5 text-sm ${
                      !source
                          ? "bg-neutral-100 text-neutral-900 font-medium"
                          : "text-neutral-600 hover:bg-neutral-50"
                  }`}
              >
                All
              </Link>
              <Link
                  href="/content-engine/images?source=upload"
                  className={`px-3 py-1.5 text-sm border-l border-neutral-200 ${
                      source === "upload"
                          ? "bg-neutral-100 text-neutral-900 font-medium"
                          : "text-neutral-600 hover:bg-neutral-50"
                  }`}
              >
                Uploaded
              </Link>
              <Link
                  href="/content-engine/images?source=dalle"
                  className={`px-3 py-1.5 text-sm border-l border-neutral-200 ${
                      source === "dalle"
                          ? "bg-neutral-100 text-neutral-900 font-medium"
                          : "text-neutral-600 hover:bg-neutral-50"
                  }`}
              >
                AI Generated
              </Link>
            </div>
          </div>

          <div className="text-sm text-neutral-500">
            {total} image{total !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Image Gallery */}
        {transformedImages.length > 0 ? (
            <>
              <ImageGallery images={transformedImages} />

              {/* Pagination */}
              {total > limit && (
                  <div className="mt-6 flex items-center justify-center gap-2">
                    {currentPage > 1 && (
                        <Link href={`/content-engine/images?page=${currentPage - 1}${source ? `&source=${source}` : ""}`}>
                          <Button variant="outline" size="sm">
                            Previous
                          </Button>
                        </Link>
                    )}
                    <span className="text-sm text-neutral-600 px-4">
                Page {currentPage} of {Math.ceil(total / limit)}
              </span>
                    {hasMore && (
                        <Link href={`/content-engine/images?page=${currentPage + 1}${source ? `&source=${source}` : ""}`}>
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
              <div className="w-16 h-16 rounded-xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <ImageIcon className="w-8 h-8 text-violet-600" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">
                {source === "upload"
                    ? "No uploaded images yet"
                    : source === "dalle"
                        ? "No AI-generated images yet"
                        : "No images yet"
                }
              </h3>
              <p className="text-sm text-neutral-600 mb-6 max-w-md mx-auto">
                {source === "upload"
                    ? "Upload your first image to use in your content."
                    : source === "dalle"
                        ? "Generate your first AI image using DALL-E."
                        : "Upload an image or generate one with AI to get started."
                }
              </p>
              <div className="flex justify-center gap-3">
                <Link href="/content-engine/images?action=upload">
                  <Button variant="outline">
                    <Upload className="w-4 h-4" />
                    Upload Image
                  </Button>
                </Link>
                <Link href="/content-engine/images?action=generate">
                  <Button>
                    <Sparkles className="w-4 h-4" />
                    Generate with AI
                  </Button>
                </Link>
              </div>
            </div>
        )}

        {/* Modals */}
        {showUploadModal && <ImageUploadModal />}
        {showGenerateModal && <ImageGenerateModal />}
      </div>
  );
}