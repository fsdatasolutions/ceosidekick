// src/app/(dashboard)/content-engine/images/components/image-detail-modal.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import {
  X,
  Download,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Upload,
  Calendar,
  FileType,
  Maximize,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface ImageDetailModalProps {
  image: ContentImage;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function ImageDetailModal({ image, onClose, onDelete }: ImageDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(image.name);
  const [editAltText, setEditAltText] = useState(image.altText || "");
  const [saving, setSaving] = useState(false);

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(image.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/content/images/${image.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, altText: editAltText }),
      });

      if (response.ok) {
        setIsEditing(false);
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update image");
      }
    } catch (error) {
      alert("Failed to update image");
    } finally {
      setSaving(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
        {/* Image Side */}
        <div className="relative w-full md:w-1/2 bg-neutral-100 min-h-[300px] md:min-h-0">
          <Image
            src={image.url}
            alt={image.altText || image.name}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          
          {/* Source Badge */}
          <div className="absolute top-4 left-4">
            <span className={`text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 ${
              image.source === "dalle" 
                ? "bg-violet-500 text-white" 
                : "bg-white/90 text-neutral-700 shadow-sm"
            }`}>
              {image.source === "dalle" ? (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Generated
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Uploaded
                </>
              )}
            </span>
          </div>
        </div>

        {/* Details Side */}
        <div className="w-full md:w-1/2 p-6 flex flex-col overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1 min-w-0 pr-4">
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full text-xl font-semibold text-neutral-900 border border-neutral-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-red/20 focus:border-primary-red"
                />
              ) : (
                <h2 className="text-xl font-semibold text-neutral-900 truncate">
                  {image.name}
                </h2>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          {/* Metadata */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 text-sm">
              <Maximize className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-600">
                {image.width && image.height 
                  ? `${image.width} × ${image.height} pixels`
                  : "Dimensions unknown"
                }
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <FileType className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-600">
                {image.mimeType} • {formatFileSize(image.size)}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span className="text-neutral-600">
                {formatDate(image.createdAt)}
              </span>
            </div>
          </div>

          {/* AI Prompt (if generated) */}
          {image.prompt && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-neutral-700 mb-2">
                Generation Prompt
              </h3>
              <p className="text-sm text-neutral-600 bg-violet-50 rounded-lg p-3 border border-violet-100">
                {image.prompt}
              </p>
            </div>
          )}

          {/* Alt Text */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-2">
              Alt Text
            </h3>
            {isEditing ? (
              <textarea
                value={editAltText}
                onChange={(e) => setEditAltText(e.target.value)}
                rows={3}
                className="w-full text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary-red/20 focus:border-primary-red resize-none"
                placeholder="Describe this image for accessibility..."
              />
            ) : (
              <p className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3 border border-neutral-100">
                {image.altText || "No alt text provided"}
              </p>
            )}
          </div>

          {/* URL */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-neutral-700 mb-2">
              Image URL
            </h3>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs text-neutral-600 bg-neutral-100 rounded-lg p-3 truncate">
                {image.url}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyUrl}
                className="flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-500" />
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-auto pt-4 border-t border-neutral-200">
            {isEditing ? (
              <div className="flex gap-2">
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(image.name);
                    setEditAltText(image.altText || "");
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(true)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
                <Button variant="outline" asChild>
                  <a href={image.url} download={image.name} target="_blank">
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this image?")) {
                      onDelete(image.id);
                      onClose();
                    }
                  }}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
