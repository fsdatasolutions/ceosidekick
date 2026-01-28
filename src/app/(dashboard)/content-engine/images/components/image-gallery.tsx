// src/app/(dashboard)/content-engine/images/components/image-gallery.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  MoreHorizontal,
  Download,
  Trash2,
  Edit,
  Sparkles,
  Upload,
  Eye,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImageDetailModal } from "./image-detail-modal";

interface ContentImage {
  id: string;
  name: string;
  url: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  source: string;
  prompt?: string;
  altText?: string;
  usageCount?: number;
  createdAt: string;
}

interface ImageGalleryProps {
  images: ContentImage[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ContentImage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyUrl = async (image: ContentImage) => {
    await navigator.clipboard.writeText(image.url);
    setCopiedId(image.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (imageId: string) => {
    if (!confirm("Are you sure you want to delete this image?")) return;
    
    try {
      const response = await fetch(`/api/content/images/${imageId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete image");
      }
    } catch (error) {
      alert("Failed to delete image");
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="group bg-white rounded-xl border border-neutral-200 overflow-hidden hover:border-neutral-300 hover:shadow-md transition-all"
          >
            {/* Image Preview */}
            <div 
              className="relative aspect-square bg-neutral-100 cursor-pointer"
              onClick={() => setSelectedImage(image)}
            >
              <Image
                src={image.url}
                alt={image.altText || image.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
              />
              
              {/* Source Badge */}
              <div className="absolute top-2 left-2">
                <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                  image.source === "dalle" 
                    ? "bg-violet-500 text-white" 
                    : "bg-white/90 text-neutral-700"
                }`}>
                  {image.source === "dalle" ? (
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Upload className="w-3 h-3" />
                      Upload
                    </span>
                  )}
                </span>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button size="sm" variant="secondary" className="gap-1">
                  <Eye className="w-4 h-4" />
                  View
                </Button>
              </div>
            </div>

            {/* Image Info */}
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-sm text-neutral-900 truncate">
                    {image.name}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {image.width && image.height 
                      ? `${image.width}×${image.height} • ` 
                      : ""
                    }
                    {formatFileSize(image.size)}
                  </p>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSelectedImage(image)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleCopyUrl(image)}>
                      {copiedId === image.id ? (
                        <>
                          <Check className="w-4 h-4 mr-2 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy URL
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={image.url} download={image.name} target="_blank">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => handleDelete(image.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedImage && (
        <ImageDetailModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}
