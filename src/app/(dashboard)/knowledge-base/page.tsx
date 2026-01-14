"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload,
  Search,
  FileText,
  MoreVertical,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  X,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Document {
  id: string;
  name: string;
  originalName: string;
  type: string;
  size: number;
  status: "pending" | "processing" | "ready" | "failed";
  chunkCount: number;
  errorMessage: string | null;
  createdAt: string;
  processedAt: string | null;
  organizationId: string | null;
}

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch documents on mount
  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      setDocuments(data.documents);
    } catch (err) {
      setError("Failed to load documents");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Poll for processing documents
  useEffect(() => {
    const processingDocs = documents.filter(
        (d) => d.status === "pending" || d.status === "processing"
    );

    if (processingDocs.length > 0) {
      const interval = setInterval(fetchDocuments, 3000);
      return () => clearInterval(interval);
    }
  }, [documents, fetchDocuments]);

  // Handle file upload
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/documents", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    }

    setUploading(false);
    fetchDocuments();
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError("Failed to delete document");
    }
  };

  // Handle reprocess
  const handleReprocess = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Reprocess failed");

      fetchDocuments();
    } catch (err) {
      setError("Failed to reprocess document");
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleUpload(e.dataTransfer.files);
  };

  // Filter documents by search
  const filteredDocuments = documents.filter((doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate stats
  const stats = {
    total: documents.length,
    totalSize: documents.reduce((sum, d) => sum + d.size, 0),
    totalChunks: documents.reduce((sum, d) => sum + d.chunkCount, 0),
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return "1 week ago";
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
      <div className="p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
              Knowledge Base
            </h1>
            <p className="text-neutral-600">
              Upload documents to create a searchable knowledge base for your team.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/chat?agent=knowledge">
              <Button variant="outline">
                <MessageSquare className="w-5 h-5" />
                Ask Questions
              </Button>
            </Link>
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                  <Upload className="w-5 h-5" />
              )}
              Upload Documents
            </Button>
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.md"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files)}
            />
          </div>
        </div>

        {/* Error Alert */}
        {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
              <button onClick={() => setError(null)}>
                <X className="w-5 h-5 text-red-500 hover:text-red-700" />
              </button>
            </div>
        )}

        {/* Storage Stats - Original 3-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500 mb-1">Documents</p>
            <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500 mb-1">Storage Used</p>
            <p className="text-2xl font-bold text-neutral-900">
              {formatSize(stats.totalSize)} / 100 MB
            </p>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <p className="text-sm text-neutral-500 mb-1">Total Chunks</p>
            <p className="text-2xl font-bold text-neutral-900">
              {stats.totalChunks.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red"
          />
        </div>

        {/* Drop Zone */}
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center mb-8 transition-colors cursor-pointer ${
                dragOver
                    ? "border-primary-red bg-red-50"
                    : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"
            }`}
        >
          <Upload
              className={`w-10 h-10 mx-auto mb-3 ${
                  dragOver ? "text-primary-red" : "text-neutral-400"
              }`}
          />
          <p className="text-neutral-600 mb-1">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-sm text-neutral-400">
            Supports PDF, DOCX, TXT, and MD files up to 10MB each
          </p>
        </div>

        {/* Documents List */}
        {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        ) : filteredDocuments.length === 0 ? (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center text-neutral-500">
              {documents.length === 0
                  ? "No documents uploaded yet. Upload your first document to get started."
                  : "No documents match your search."}
            </div>
        ) : (
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-neutral-700">
                    Document
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-neutral-700">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-neutral-700">
                    Size
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-neutral-700">
                    Uploaded
                  </th>
                  <th className="text-right px-6 py-3 text-sm font-semibold text-neutral-700">
                    Actions
                  </th>
                </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary-red-light flex items-center justify-center">
                            <FileText className="w-5 h-5 text-primary-red" />
                          </div>
                          <div>
                            <p className="font-medium text-neutral-900">{doc.name}</p>
                            <p className="text-sm text-neutral-500">
                              {doc.chunkCount > 0 && `${doc.chunkCount} chunks indexed`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {doc.status === "ready" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Ready
                      </span>
                        ) : doc.status === "failed" ? (
                            <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-sm cursor-help"
                                title={doc.errorMessage || "Processing failed"}
                            >
                        <AlertCircle className="w-3.5 h-3.5" />
                        Failed
                      </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        Processing
                      </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-neutral-600">
                        {formatSize(doc.size)}
                      </td>
                      <td className="px-6 py-4 text-neutral-600">
                        {formatDate(doc.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {doc.status === "failed" && (
                              <button
                                  onClick={() => handleReprocess(doc.id)}
                                  className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                                  title="Retry processing"
                              >
                                <RefreshCw className="w-4 h-4 text-neutral-500" />
                              </button>
                          )}
                          <button className="p-2 rounded-lg hover:bg-neutral-100 transition-colors">
                            <MoreVertical className="w-4 h-4 text-neutral-500" />
                          </button>
                          <button
                              onClick={() => handleDelete(doc.id)}
                              className="p-2 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
        )}
      </div>
  );
}