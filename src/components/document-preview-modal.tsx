// src/components/document-preview-modal.tsx
"use client";

import { useState, useEffect } from "react";
import {
    X,
    Download,
    Database,
    FileText,
    Presentation,
    Sheet,
    File,
    Loader2,
    Check,
    Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
    format: string;
    icon: React.ElementType;
}

interface DocumentPreviewModalProps {
    template: Template | null;
    isOpen: boolean;
    onClose: () => void;
}

type SaveAction = "download" | "knowledge-base" | "both";

export function DocumentPreviewModal({
                                         template,
                                         isOpen,
                                         onClose,
                                     }: DocumentPreviewModalProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [previewData, setPreviewData] = useState<string | null>(null);
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const [documentBlob, setDocumentBlob] = useState<Blob | null>(null);
    const [saveAction, setSaveAction] = useState<SaveAction>("both");
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen && template) {
            setPreviewData(null);
            setPreviewHtml(null);
            setDocumentBlob(null);
            setSaveSuccess(false);
            setError(null);
            generatePreview();
        }
    }, [isOpen, template]);

    async function generatePreview() {
        if (!template) return;

        setIsGenerating(true);
        setError(null);

        try {
            const res = await fetch("/api/templates/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ templateId: template.id, preview: true }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to generate document");
            }

            const blob = await res.blob();
            setDocumentBlob(blob);

            // Generate preview based on file type
            if (template.format === "pdf") {
                // For PDF, create object URL for iframe preview
                const url = URL.createObjectURL(blob);
                setPreviewData(url);
            } else if (template.format === "docx") {
                // For DOCX, convert to HTML using mammoth
                await convertDocxToHtml(blob);
            } else if (template.format === "xlsx") {
                // For Excel, convert to HTML table
                await convertXlsxToHtml(blob);
            } else if (template.format === "pptx") {
                // For PowerPoint, show slide count and metadata
                setPreviewHtml(generatePptxPreview());
            }
        } catch (err) {
            console.error("Preview generation failed:", err);
            setError(err instanceof Error ? err.message : "Failed to generate preview");
        } finally {
            setIsGenerating(false);
        }
    }

    async function convertDocxToHtml(blob: Blob) {
        try {
            // Dynamically import mammoth for DOCX conversion
            const mammoth = await import("mammoth");
            const arrayBuffer = await blob.arrayBuffer();
            const result = await mammoth.convertToHtml({ arrayBuffer });
            setPreviewHtml(`
        <div class="prose prose-sm max-w-none p-4">
          ${result.value}
        </div>
      `);
        } catch (err) {
            console.error("DOCX conversion failed:", err);
            setPreviewHtml(`
        <div class="flex flex-col items-center justify-center h-full text-neutral-500">
          <FileText class="w-16 h-16 mb-4" />
          <p>Word document preview not available</p>
          <p class="text-sm">Download to view the full document</p>
        </div>
      `);
        }
    }

    async function convertXlsxToHtml(blob: Blob) {
        try {
            // Dynamically import xlsx for Excel conversion
            const XLSX = await import("xlsx");
            const arrayBuffer = await blob.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: "array" });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const html = XLSX.utils.sheet_to_html(firstSheet, { editable: false });
            setPreviewHtml(`
        <div class="overflow-auto p-4">
          <style>
            table { border-collapse: collapse; font-size: 12px; }
            td, th { border: 1px solid #e5e7eb; padding: 4px 8px; }
            th { background: #f3f4f6; font-weight: 600; }
          </style>
          ${html}
        </div>
      `);
        } catch (err) {
            console.error("XLSX conversion failed:", err);
            setPreviewHtml(`
        <div class="flex flex-col items-center justify-center h-full text-neutral-500">
          <Sheet class="w-16 h-16 mb-4" />
          <p>Excel preview not available</p>
          <p class="text-sm">Download to view the full spreadsheet</p>
        </div>
      `);
        }
    }

    function generatePptxPreview(): string {
        return `
      <div class="flex flex-col items-center justify-center h-full text-neutral-600 p-8">
        <div class="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
          <svg class="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
          </svg>
        </div>
        <p class="font-medium text-lg mb-2">PowerPoint Presentation</p>
        <p class="text-sm text-neutral-500 mb-4">11 slides • 16:9 format</p>
        <div class="text-xs text-neutral-400 space-y-1 text-center">
          <p>Includes: Title, Problem, Solution, Market,</p>
          <p>Business Model, Traction, Team, Financials, Ask</p>
        </div>
      </div>
    `;
    }

    async function handleSave() {
        if (!documentBlob || !template) return;

        setIsSaving(true);
        setError(null);

        try {
            // Download locally
            if (saveAction === "download" || saveAction === "both") {
                const url = URL.createObjectURL(documentBlob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${template.id}.${template.format}`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            // Save to Knowledge Base
            if (saveAction === "knowledge-base" || saveAction === "both") {
                const formData = new FormData();
                formData.append(
                    "file",
                    documentBlob,
                    `${template.name}.${template.format}`
                );
                formData.append("source", "template-generator");
                formData.append("templateId", template.id);

                const res = await fetch("/api/templates/save-to-knowledge-base", {
                    method: "POST",
                    body: formData,
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to save to Knowledge Base");
                }
            }

            setSaveSuccess(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            console.error("Save failed:", err);
            setError(err instanceof Error ? err.message : "Failed to save document");
        } finally {
            setIsSaving(false);
        }
    }

    if (!isOpen || !template) return null;

    const Icon = template.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-red/10 flex items-center justify-center">
                            <Icon className="w-6 h-6 text-primary-red" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-neutral-900">
                                {template.name}
                            </h2>
                            <p className="text-sm text-neutral-500">
                                {template.category} • .{template.format.toUpperCase()}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                    >
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>

                {/* Preview Area */}
                <div className="flex-1 overflow-hidden p-6">
                    <div className="h-[400px] bg-neutral-50 rounded-xl border border-neutral-200 overflow-hidden">
                        {isGenerating ? (
                            <div className="flex flex-col items-center justify-center h-full">
                                <Loader2 className="w-10 h-10 text-primary-red animate-spin mb-4" />
                                <p className="text-neutral-600">Generating preview...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full text-red-500">
                                <p className="font-medium mb-2">Error</p>
                                <p className="text-sm">{error}</p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={generatePreview}
                                >
                                    Try Again
                                </Button>
                            </div>
                        ) : previewData && template.format === "pdf" ? (
                            <iframe
                                src={previewData}
                                className="w-full h-full"
                                title="PDF Preview"
                            />
                        ) : previewHtml ? (
                            <div
                                className="w-full h-full overflow-auto"
                                dangerouslySetInnerHTML={{ __html: previewHtml }}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-neutral-500">
                                <Eye className="w-12 h-12 mb-4" />
                                <p>Preview will appear here</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Area */}
                <div className="p-6 border-t border-neutral-200 bg-neutral-50 rounded-b-2xl">
                    {saveSuccess ? (
                        <div className="flex items-center justify-center gap-2 text-green-600 py-2">
                            <Check className="w-5 h-5" />
                            <span className="font-medium">
                Document saved successfully!
              </span>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            {/* Save Options */}
                            <div className="flex items-center gap-2 flex-1">
                                <span className="text-sm text-neutral-600 mr-2">Save to:</span>
                                <button
                                    onClick={() => setSaveAction("download")}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        saveAction === "download"
                                            ? "bg-primary-red text-white"
                                            : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                                    }`}
                                >
                                    <Download className="w-4 h-4" />
                                    Download Only
                                </button>
                                <button
                                    onClick={() => setSaveAction("knowledge-base")}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        saveAction === "knowledge-base"
                                            ? "bg-primary-red text-white"
                                            : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                                    }`}
                                >
                                    <Database className="w-4 h-4" />
                                    Knowledge Base
                                </button>
                                <button
                                    onClick={() => setSaveAction("both")}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        saveAction === "both"
                                            ? "bg-primary-red text-white"
                                            : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                                    }`}
                                >
                                    <Check className="w-4 h-4" />
                                    Both
                                </button>
                            </div>

                            {/* Generate Button */}
                            <Button
                                onClick={handleSave}
                                disabled={isGenerating || isSaving || !documentBlob}
                                className="min-w-[140px]"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Save Document
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    {error && !isGenerating && (
                        <p className="text-sm text-red-500 mt-2 text-center">{error}</p>
                    )}
                </div>
            </div>
        </div>
    );
}