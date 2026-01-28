// src/app/(dashboard)/content-engine/create/[id]/review/page.tsx
// Campaign Review - Preview, edit, and save generated content

"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowLeft,
    Image as ImageIcon,
    FileText,
    MessageSquare,
    Newspaper,
    Loader2,
    Check,
    RefreshCw,
    Save,
    Eye,
    Edit,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface GeneratedImage {
    id?: string;
    url?: string;
    prompt?: string;
    status: string;
    error?: string;
}

interface GeneratedArticle {
    id?: string;
    title?: string;
    content?: string;
    description?: string;
    status: string;
    error?: string;
}

interface GeneratedPost {
    id?: string;
    content?: string;
    status: string;
    error?: string;
}

interface GeneratedBlog {
    id?: string;
    title?: string;
    content?: string;
    description?: string;
    category?: string;
    tags?: string[];
    status: string;
    error?: string;
}

interface Campaign {
    id: string;
    brief: {
        topic: string;
        targetAudience?: string;
        keyPoints?: string[];
        tone?: string;
    };
    outputs: {
        generateImage: boolean;
        generateLinkedinArticle: boolean;
        generateLinkedinPost: boolean;
        generateWebBlog: boolean;
    };
    generated: {
        image?: GeneratedImage;
        linkedinArticle?: GeneratedArticle;
        linkedinPost?: GeneratedPost;
        webBlog?: GeneratedBlog;
    };
    status: string;
}

type ContentType = 'image' | 'linkedinArticle' | 'linkedinPost' | 'webBlog';

interface EditedArticle {
    title?: string;
    content?: string;
    description?: string;
}

interface EditedPost {
    content?: string;
}

interface EditedBlog {
    title?: string;
    content?: string;
    description?: string;
    category?: string;
    tags?: string[];
}

interface EditedContent {
    linkedinArticle?: EditedArticle;
    linkedinPost?: EditedPost;
    webBlog?: EditedBlog;
}

export default function CampaignReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();

    console.log("[Review Page] Component mounted with ID:", id);

    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [regenerating, setRegenerating] = useState<ContentType | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Editable content states
    const [editingType, setEditingType] = useState<ContentType | null>(null);
    const [editedContent, setEditedContent] = useState<EditedContent>({});

    // Expanded sections
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        image: true,
        linkedinArticle: true,
        linkedinPost: true,
        webBlog: true,
    });

    // Load campaign from session storage or API
    useEffect(() => {
        const loadCampaign = async () => {
            console.log("[Review Page] Starting to load campaign for ID:", id);

            try {
                // First, check if campaign data is in sessionStorage
                const storageKey = `campaign-${id}`;
                console.log("[Review Page] Checking sessionStorage for key:", storageKey);

                let stored: string | null = null;
                try {
                    stored = sessionStorage.getItem(storageKey);
                    console.log("[Review Page] sessionStorage result:", stored ? `Found (${stored.length} chars)` : "Not found");
                } catch (storageError) {
                    console.error("[Review Page] sessionStorage access error:", storageError);
                }

                if (stored) {
                    try {
                        const parsed = JSON.parse(stored) as Campaign;
                        console.log("[Review Page] Parsed campaign from storage:", parsed?.id);

                        if (parsed && parsed.id) {
                            setCampaign(parsed);
                            setLoading(false);
                            console.log("[Review Page] Campaign loaded from sessionStorage successfully");
                            return;
                        } else {
                            console.warn("[Review Page] Parsed data missing id:", parsed);
                        }
                    } catch (parseErr) {
                        console.error("[Review Page] Failed to parse stored campaign:", parseErr);
                    }
                }

                // Fallback: Try to fetch from API (in-memory store)
                console.log("[Review Page] Trying API fallback...");
                const apiUrl = `/api/content/campaigns/${id}`;
                console.log("[Review Page] Fetching from:", apiUrl);

                const response = await fetch(apiUrl);
                console.log("[Review Page] API response status:", response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log("[Review Page] API response data:", data?.campaign?.id);

                    if (data.campaign) {
                        setCampaign(data.campaign as Campaign);
                        // Also store in sessionStorage for future use
                        try {
                            sessionStorage.setItem(storageKey, JSON.stringify(data.campaign));
                            console.log("[Review Page] Stored campaign in sessionStorage from API");
                        } catch (storeErr) {
                            console.error("[Review Page] Failed to store in sessionStorage:", storeErr);
                        }
                        setLoading(false);
                        console.log("[Review Page] Campaign loaded from API successfully");
                        return;
                    } else {
                        console.warn("[Review Page] API response missing campaign data");
                    }
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    console.error("[Review Page] API error:", response.status, errorData);
                }

                // If we still don't have the campaign, show error and redirect
                console.error("[Review Page] Failed to load campaign from any source");
                setError("Campaign not found. Please create a new campaign.");
                setTimeout(() => {
                    console.log("[Review Page] Redirecting to /content-engine/create");
                    router.push('/content-engine/create');
                }, 2000);
            } catch (err: unknown) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load campaign";
                console.error("[Review Page] Fatal error loading campaign:", errorMessage, err);
                setError(errorMessage);
                setTimeout(() => {
                    console.log("[Review Page] Redirecting due to error");
                    router.push('/content-engine/create');
                }, 2000);
            } finally {
                setLoading(false);
            }
        };

        loadCampaign();
    }, [id, router]);

    // Store campaign in session when it changes
    useEffect(() => {
        if (campaign) {
            try {
                sessionStorage.setItem(`campaign-${id}`, JSON.stringify(campaign));
                console.log("[Review Page] Updated campaign in sessionStorage");
            } catch (err) {
                console.error("[Review Page] Failed to update sessionStorage:", err);
            }
        }
    }, [campaign, id]);

    const handleRegenerate = async (contentType: ContentType) => {
        if (!campaign) return;

        setRegenerating(contentType);
        setError(null);

        try {
            const response = await fetch(`/api/content/campaigns/${id}/regenerate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contentType }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Regeneration failed');
            }

            setCampaign(data.campaign as Campaign);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate';
            setError(errorMessage);
        } finally {
            setRegenerating(null);
        }
    };

    const handleSave = async () => {
        if (!campaign) return;

        setSaving(true);
        setError(null);

        try {
            // Merge edited content with generated content
            const saveData: Record<string, unknown> = {};

            if (campaign.outputs.generateLinkedinArticle) {
                const article = editedContent.linkedinArticle || campaign.generated.linkedinArticle;
                saveData.linkedinArticle = {
                    title: article?.title || campaign.brief.topic,
                    content: article?.content || '',
                    description: article?.description,
                };
            }

            if (campaign.outputs.generateLinkedinPost) {
                const post = editedContent.linkedinPost || campaign.generated.linkedinPost;
                saveData.linkedinPost = {
                    content: post?.content || '',
                };
            }

            if (campaign.outputs.generateWebBlog) {
                const blog = editedContent.webBlog || campaign.generated.webBlog;
                saveData.webBlog = {
                    title: blog?.title || campaign.brief.topic,
                    content: blog?.content || '',
                    description: blog?.description,
                    category: blog?.category,
                    tags: blog?.tags,
                };
            }

            if (campaign.outputs.generateImage && campaign.generated.image?.id) {
                saveData.heroImageId = campaign.generated.image.id;
            }

            const response = await fetch(`/api/content/campaigns/${id}/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(saveData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Save failed');
            }

            // Clear session storage
            sessionStorage.removeItem(`campaign-${id}`);

            // Redirect to content engine with success message
            router.push('/content-engine?saved=true');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to save';
            setError(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const startEditing = (type: ContentType) => {
        if (!campaign) return;

        if (type === 'linkedinArticle' && campaign.generated.linkedinArticle) {
            setEditedContent(prev => ({
                ...prev,
                linkedinArticle: {
                    title: campaign.generated.linkedinArticle?.title,
                    content: campaign.generated.linkedinArticle?.content,
                    description: campaign.generated.linkedinArticle?.description,
                }
            }));
        } else if (type === 'linkedinPost' && campaign.generated.linkedinPost) {
            setEditedContent(prev => ({
                ...prev,
                linkedinPost: {
                    content: campaign.generated.linkedinPost?.content,
                }
            }));
        } else if (type === 'webBlog' && campaign.generated.webBlog) {
            setEditedContent(prev => ({
                ...prev,
                webBlog: {
                    title: campaign.generated.webBlog?.title,
                    content: campaign.generated.webBlog?.content,
                    description: campaign.generated.webBlog?.description,
                    category: campaign.generated.webBlog?.category,
                    tags: campaign.generated.webBlog?.tags,
                }
            }));
        }
        setEditingType(type);
    };

    const cancelEditing = () => {
        setEditingType(null);
    };

    const saveEdits = () => {
        setEditingType(null);
    };

    // Helper functions to get display content
    const getArticleContent = (): GeneratedArticle | undefined => {
        if (editedContent.linkedinArticle) {
            return { ...campaign?.generated.linkedinArticle, ...editedContent.linkedinArticle } as GeneratedArticle;
        }
        return campaign?.generated.linkedinArticle;
    };

    const getPostContent = (): GeneratedPost | undefined => {
        if (editedContent.linkedinPost) {
            return { ...campaign?.generated.linkedinPost, ...editedContent.linkedinPost } as GeneratedPost;
        }
        return campaign?.generated.linkedinPost;
    };

    const getBlogContent = (): GeneratedBlog | undefined => {
        if (editedContent.webBlog) {
            return { ...campaign?.generated.webBlog, ...editedContent.webBlog } as GeneratedBlog;
        }
        return campaign?.generated.webBlog;
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-red mx-auto mb-4" />
                    <p className="text-neutral-600">Loading campaign...</p>
                </div>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium">{error || "Campaign not found"}</p>
                        <p className="text-sm mt-1">Redirecting to campaign creation...</p>
                    </div>
                </div>
            </div>
        );
    }

    const articleContent = getArticleContent();
    const postContent = getPostContent();
    const blogContent = getBlogContent();

    return (
        <div className="p-8">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/content-engine/create"
                    className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Start Over
                </Link>

                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-red to-amber-500 flex items-center justify-center">
                            <Eye className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-display text-2xl font-bold text-neutral-900">
                                Review Your Content
                            </h1>
                            <p className="text-neutral-600">
                                Preview, edit, and regenerate before saving
                            </p>
                        </div>
                    </div>

                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Save All Content
                    </Button>
                </div>
            </div>

            {/* Brief Summary */}
            <div className="mb-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <h3 className="text-sm font-medium text-neutral-700 mb-2">Content Brief</h3>
                <p className="text-neutral-900 font-medium">{campaign.brief.topic}</p>
                {campaign.brief.targetAudience && (
                    <p className="text-sm text-neutral-600 mt-1">
                        Audience: {campaign.brief.targetAudience}
                    </p>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Content Sections */}
            <div className="space-y-4">
                {/* Hero Image */}
                {campaign.outputs.generateImage && campaign.generated.image && (
                    <ContentSection
                        title="Hero Image"
                        icon={ImageIcon}
                        iconColor="bg-violet-100 text-violet-600"
                        status={campaign.generated.image.status}
                        expanded={expandedSections.image}
                        onToggle={() => toggleSection('image')}
                        onRegenerate={() => handleRegenerate('image')}
                        regenerating={regenerating === 'image'}
                    >
                        {campaign.generated.image.status === 'completed' && campaign.generated.image.url && (
                            <div className="space-y-3">
                                <div className="relative aspect-video rounded-lg overflow-hidden bg-neutral-100">
                                    <Image
                                        src={campaign.generated.image.url}
                                        alt="Generated hero image"
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                {campaign.generated.image.prompt && (
                                    <p className="text-xs text-neutral-500">
                                        <strong>Prompt:</strong> {campaign.generated.image.prompt}
                                    </p>
                                )}
                            </div>
                        )}
                        {campaign.generated.image.status === 'error' && (
                            <p className="text-red-600 text-sm">{campaign.generated.image.error}</p>
                        )}
                    </ContentSection>
                )}

                {/* LinkedIn Article */}
                {campaign.outputs.generateLinkedinArticle && campaign.generated.linkedinArticle && (
                    <ContentSection
                        title="LinkedIn Article"
                        icon={FileText}
                        iconColor="bg-blue-100 text-blue-600"
                        status={campaign.generated.linkedinArticle.status}
                        expanded={expandedSections.linkedinArticle}
                        onToggle={() => toggleSection('linkedinArticle')}
                        onRegenerate={() => handleRegenerate('linkedinArticle')}
                        regenerating={regenerating === 'linkedinArticle'}
                        onEdit={() => startEditing('linkedinArticle')}
                        editing={editingType === 'linkedinArticle'}
                    >
                        {editingType === 'linkedinArticle' ? (
                            <EditableArticleContent
                                content={editedContent.linkedinArticle || {}}
                                onChange={(updated) => setEditedContent(prev => ({ ...prev, linkedinArticle: updated }))}
                                onSave={saveEdits}
                                onCancel={cancelEditing}
                            />
                        ) : (
                            campaign.generated.linkedinArticle.status === 'completed' && articleContent && (
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-lg text-neutral-900">
                                        {articleContent.title}
                                    </h4>
                                    <p className="text-sm text-neutral-600">
                                        {articleContent.description}
                                    </p>
                                    <div className="prose prose-sm max-w-none p-4 bg-neutral-50 rounded-lg max-h-96 overflow-y-auto">
                                        <pre className="whitespace-pre-wrap text-sm font-sans">
                                            {articleContent.content}
                                        </pre>
                                    </div>
                                </div>
                            )
                        )}
                        {campaign.generated.linkedinArticle.status === 'error' && (
                            <p className="text-red-600 text-sm">{campaign.generated.linkedinArticle.error}</p>
                        )}
                    </ContentSection>
                )}

                {/* LinkedIn Post */}
                {campaign.outputs.generateLinkedinPost && campaign.generated.linkedinPost && (
                    <ContentSection
                        title="LinkedIn Post"
                        icon={MessageSquare}
                        iconColor="bg-sky-100 text-sky-600"
                        status={campaign.generated.linkedinPost.status}
                        expanded={expandedSections.linkedinPost}
                        onToggle={() => toggleSection('linkedinPost')}
                        onRegenerate={() => handleRegenerate('linkedinPost')}
                        regenerating={regenerating === 'linkedinPost'}
                        onEdit={() => startEditing('linkedinPost')}
                        editing={editingType === 'linkedinPost'}
                    >
                        {editingType === 'linkedinPost' ? (
                            <EditablePostContent
                                content={editedContent.linkedinPost || {}}
                                onChange={(updated) => setEditedContent(prev => ({ ...prev, linkedinPost: updated }))}
                                onSave={saveEdits}
                                onCancel={cancelEditing}
                            />
                        ) : (
                            campaign.generated.linkedinPost.status === 'completed' && postContent && (
                                <div className="p-4 bg-neutral-50 rounded-lg">
                                    <pre className="whitespace-pre-wrap text-sm font-sans">
                                        {postContent.content}
                                    </pre>
                                </div>
                            )
                        )}
                        {campaign.generated.linkedinPost.status === 'error' && (
                            <p className="text-red-600 text-sm">{campaign.generated.linkedinPost.error}</p>
                        )}
                    </ContentSection>
                )}

                {/* Web Blog */}
                {campaign.outputs.generateWebBlog && campaign.generated.webBlog && (
                    <ContentSection
                        title="Web Blog"
                        icon={Newspaper}
                        iconColor="bg-emerald-100 text-emerald-600"
                        status={campaign.generated.webBlog.status}
                        expanded={expandedSections.webBlog}
                        onToggle={() => toggleSection('webBlog')}
                        onRegenerate={() => handleRegenerate('webBlog')}
                        regenerating={regenerating === 'webBlog'}
                        onEdit={() => startEditing('webBlog')}
                        editing={editingType === 'webBlog'}
                    >
                        {editingType === 'webBlog' ? (
                            <EditableBlogContent
                                content={editedContent.webBlog || {}}
                                onChange={(updated) => setEditedContent(prev => ({ ...prev, webBlog: updated }))}
                                onSave={saveEdits}
                                onCancel={cancelEditing}
                            />
                        ) : (
                            campaign.generated.webBlog.status === 'completed' && blogContent && (
                                <div className="space-y-3">
                                    <h4 className="font-semibold text-lg text-neutral-900">
                                        {blogContent.title}
                                    </h4>
                                    <p className="text-sm text-neutral-600">
                                        {blogContent.description}
                                    </p>
                                    {blogContent.tags && blogContent.tags.length > 0 && (
                                        <div className="flex gap-2 flex-wrap">
                                            {blogContent.tags.map((tag, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="prose prose-sm max-w-none p-4 bg-neutral-50 rounded-lg max-h-96 overflow-y-auto">
                                        <pre className="whitespace-pre-wrap text-sm font-sans">
                                            {blogContent.content}
                                        </pre>
                                    </div>
                                </div>
                            )
                        )}
                        {campaign.generated.webBlog.status === 'error' && (
                            <p className="text-red-600 text-sm">{campaign.generated.webBlog.error}</p>
                        )}
                    </ContentSection>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-8 flex justify-between">
                <Link href="/content-engine/create">
                    <Button variant="outline">
                        <ArrowLeft className="w-4 h-4" />
                        Start Over
                    </Button>
                </Link>
                <Button onClick={handleSave} disabled={saving} size="lg">
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Save All Content
                </Button>
            </div>
        </div>
    );
}

// Content Section Component
function ContentSection({
                            title,
                            icon: Icon,
                            iconColor,
                            status,
                            expanded,
                            onToggle,
                            onRegenerate,
                            regenerating,
                            onEdit,
                            editing,
                            children,
                        }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
    status: string;
    expanded: boolean;
    onToggle: () => void;
    onRegenerate: () => void;
    regenerating: boolean;
    onEdit?: () => void;
    editing?: boolean;
    children: React.ReactNode;
}) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-700';
            case 'error': return 'bg-red-100 text-red-700';
            case 'generating': return 'bg-amber-100 text-amber-700';
            default: return 'bg-neutral-100 text-neutral-600';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${iconColor} flex items-center justify-center`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-medium text-neutral-900">{title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(status)}`}>
                        {status}
                    </span>
                </div>
                {expanded ? (
                    <ChevronUp className="w-5 h-5 text-neutral-400" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-neutral-400" />
                )}
            </button>

            {expanded && (
                <div className="px-4 pb-4 border-t border-neutral-100">
                    <div className="flex gap-2 my-3">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={onRegenerate}
                            disabled={regenerating}
                        >
                            {regenerating ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <RefreshCw className="w-3 h-3" />
                            )}
                            Regenerate
                        </Button>
                        {onEdit && !editing && status === 'completed' && (
                            <Button size="sm" variant="outline" onClick={onEdit}>
                                <Edit className="w-3 h-3" />
                                Edit
                            </Button>
                        )}
                    </div>
                    {children}
                </div>
            )}
        </div>
    );
}

// Editable Article Content Component
function EditableArticleContent({
                                    content,
                                    onChange,
                                    onSave,
                                    onCancel,
                                }: {
    content: EditedArticle;
    onChange: (updated: EditedArticle) => void;
    onSave: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="space-y-3">
            <input
                type="text"
                value={content.title || ''}
                onChange={(e) => onChange({ ...content, title: e.target.value })}
                placeholder="Title"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red/20 focus:border-primary-red font-medium"
            />
            <textarea
                value={content.description || ''}
                onChange={(e) => onChange({ ...content, description: e.target.value })}
                placeholder="Description"
                rows={2}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red/20 focus:border-primary-red resize-none"
            />
            <textarea
                value={content.content || ''}
                onChange={(e) => onChange({ ...content, content: e.target.value })}
                placeholder="Content"
                rows={15}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red/20 focus:border-primary-red resize-none font-mono text-sm"
            />
            <div className="flex gap-2">
                <Button size="sm" onClick={onSave}>
                    <Check className="w-3 h-3" />
                    Save Edits
                </Button>
                <Button size="sm" variant="outline" onClick={onCancel}>
                    <X className="w-3 h-3" />
                    Cancel
                </Button>
            </div>
        </div>
    );
}

// Editable Post Content Component
function EditablePostContent({
                                 content,
                                 onChange,
                                 onSave,
                                 onCancel,
                             }: {
    content: EditedPost;
    onChange: (updated: EditedPost) => void;
    onSave: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="space-y-3">
            <textarea
                value={content.content || ''}
                onChange={(e) => onChange({ ...content, content: e.target.value })}
                rows={10}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red/20 focus:border-primary-red resize-none font-mono text-sm"
            />
            <div className="flex gap-2">
                <Button size="sm" onClick={onSave}>
                    <Check className="w-3 h-3" />
                    Save Edits
                </Button>
                <Button size="sm" variant="outline" onClick={onCancel}>
                    <X className="w-3 h-3" />
                    Cancel
                </Button>
            </div>
        </div>
    );
}

// Editable Blog Content Component
function EditableBlogContent({
                                 content,
                                 onChange,
                                 onSave,
                                 onCancel,
                             }: {
    content: EditedBlog;
    onChange: (updated: EditedBlog) => void;
    onSave: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="space-y-3">
            <input
                type="text"
                value={content.title || ''}
                onChange={(e) => onChange({ ...content, title: e.target.value })}
                placeholder="Title"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red/20 focus:border-primary-red font-medium"
            />
            <textarea
                value={content.description || ''}
                onChange={(e) => onChange({ ...content, description: e.target.value })}
                placeholder="Description"
                rows={2}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red/20 focus:border-primary-red resize-none"
            />
            <textarea
                value={content.content || ''}
                onChange={(e) => onChange({ ...content, content: e.target.value })}
                placeholder="Content"
                rows={15}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-red/20 focus:border-primary-red resize-none font-mono text-sm"
            />
            <div className="flex gap-2">
                <Button size="sm" onClick={onSave}>
                    <Check className="w-3 h-3" />
                    Save Edits
                </Button>
                <Button size="sm" variant="outline" onClick={onCancel}>
                    <X className="w-3 h-3" />
                    Cancel
                </Button>
            </div>
        </div>
    );
}