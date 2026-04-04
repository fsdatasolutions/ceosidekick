// src/app/(dashboard)/content-engine/linkedin-posts/bulk/page.tsx
// Bulk LinkedIn Post Creation - generate multiple research-driven posts at once

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowLeft,
    Sparkles,
    Loader2,
    RefreshCw,
    Trash2,
    Edit3,
    Check,
    X,
    CalendarClock,
    Save,
    Layers,
    ChevronRight,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    WriterProfileSelector,
    getAuthorDisplayInfo,
} from "@/components/content-engine/writer-profile-selector";
import {
    useLinkedInStatus,
    useLinkedInOrgStatus,
} from "@/lib/hooks/useLinkedInStatus";

// Reuse the same options from the single post creator
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

type Step = "configure" | "generating" | "review" | "schedule";

interface GeneratedPost {
    id: string;
    content: string;
    angle: string;
    charCount: number;
    authorName: string;
    authorRole: string;
    authorImageUrl: string;
}

interface ScheduleSuggestion {
    postId: string;
    suggestedDate: string;
}

export default function BulkCreatePage() {
    const router = useRouter();

    // Step management
    const [step, setStep] = useState<Step>("configure");

    // Configuration state
    const [count, setCount] = useState(5);
    const [theme, setTheme] = useState("");
    const [authorId, setAuthorId] = useState("self");
    const [targetAudience, setTargetAudience] = useState("");
    const [tone, setTone] = useState("professional");
    const [postType, setPostType] = useState("insight");

    // User profile
    const [userName, setUserName] = useState("You");
    const [userRole, setUserRole] = useState("");
    const [userImage, setUserImage] = useState("");

    // Generation state
    const [generating, setGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [posts, setPosts] = useState<GeneratedPost[]>([]);

    // Edit state
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");
    const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

    // Schedule state
    const [schedules, setSchedules] = useState<ScheduleSuggestion[]>([]);
    const [startDateTime, setStartDateTime] = useState(() => {
        // Default to tomorrow at 9:00 AM
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        return formatDateTimeLocal(tomorrow);
    });
    const [postAs, setPostAs] = useState("personal");
    const [visibility, setVisibility] = useState<"PUBLIC" | "CONNECTIONS">("PUBLIC");
    const [scheduling, setScheduling] = useState(false);
    const [scheduleError, setScheduleError] = useState<string | null>(null);

    // LinkedIn status
    const { status: linkedInStatus } = useLinkedInStatus();
    const { status: linkedInOrgStatus } = useLinkedInOrgStatus();

    // Load user profile
    useEffect(() => {
        async function loadUserProfile() {
            try {
                const [settingsRes, sessionRes] = await Promise.all([
                    fetch("/api/settings"),
                    fetch("/api/auth/session"),
                ]);
                if (settingsRes.ok) {
                    const data = await settingsRes.json();
                    if (data.settings?.userRole) setUserRole(data.settings.userRole);
                }
                if (sessionRes.ok) {
                    const sessionData = await sessionRes.json();
                    if (sessionData?.user?.name) setUserName(sessionData.user.name);
                    if (sessionData?.user?.image) setUserImage(sessionData.user.image);
                }
            } catch {
                // Defaults are fine
            }
        }
        loadUserProfile();
    }, []);

    // Generate posts
    const handleGenerate = async () => {
        setGenerating(true);
        setGenerationError(null);
        setStep("generating");

        try {
            const response = await fetch("/api/content/posts/bulk-generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    count,
                    theme: theme.trim() || undefined,
                    authorId,
                    targetAudience: targetAudience.trim() || undefined,
                    tone,
                    postType,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Generation failed");
            }

            setPosts(data.posts);
            setStep("review");
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to generate posts";
            setGenerationError(msg);
            setStep("configure");
        } finally {
            setGenerating(false);
        }
    };

    // Edit a post inline
    const startEditing = (post: GeneratedPost) => {
        setEditingPostId(post.id);
        setEditContent(post.content);
    };

    const saveEdit = async () => {
        if (!editingPostId) return;

        try {
            const response = await fetch(`/api/content/posts/${editingPostId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: editContent }),
            });

            if (response.ok) {
                setPosts((prev) =>
                    prev.map((p) =>
                        p.id === editingPostId
                            ? { ...p, content: editContent, charCount: editContent.length }
                            : p
                    )
                );
            }
        } catch {
            // Silent fail, user can retry
        }

        setEditingPostId(null);
        setEditContent("");
    };

    const cancelEdit = () => {
        setEditingPostId(null);
        setEditContent("");
    };

    // Regenerate a single post
    const handleRegenerate = async (postId: string) => {
        setRegeneratingId(postId);

        try {
            const response = await fetch(`/api/content/posts/${postId}/regenerate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    theme: theme.trim() || undefined,
                    authorId,
                    tone,
                    postType,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setPosts((prev) =>
                    prev.map((p) =>
                        p.id === postId
                            ? {
                                  ...p,
                                  content: data.post.content,
                                  charCount: data.post.charCount,
                              }
                            : p
                    )
                );
            }
        } catch {
            // Silent fail
        } finally {
            setRegeneratingId(null);
        }
    };

    // Remove a post from the batch
    const handleRemovePost = async (postId: string) => {
        try {
            await fetch(`/api/content/posts/${postId}`, { method: "DELETE" });
        } catch {
            // Continue anyway
        }
        setPosts((prev) => prev.filter((p) => p.id !== postId));
    };

    // Move to schedule step
    const handleProceedToSchedule = () => {
        setStep("schedule");
        setScheduleError(null);
    };

    // Fetch schedule suggestions based on selected start time
    const handleGenerateSchedule = async () => {
        try {
            const response = await fetch("/api/content/posts/suggest-schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    postIds: posts.map((p) => p.id),
                    startDateTime: new Date(startDateTime).toISOString(),
                }),
            });

            const data = await response.json();
            if (response.ok) {
                setSchedules(data.suggestions);
            }
        } catch {
            // Fallback: no suggestions, user can set manually
        }
    };

    // Update a schedule date
    const updateScheduleDate = (postId: string, newDate: string) => {
        setSchedules((prev) =>
            prev.map((s) =>
                s.postId === postId ? { ...s, suggestedDate: newDate } : s
            )
        );
    };

    // Schedule all posts
    const handleScheduleAll = async () => {
        setScheduling(true);
        setScheduleError(null);

        try {
            const response = await fetch("/api/content/posts/batch-schedule", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    schedules: schedules.map((s) => ({
                        postId: s.postId,
                        scheduledFor: s.suggestedDate,
                        postAs,
                        visibility,
                    })),
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Scheduling failed");
            }

            router.push("/content-engine/linkedin-posts?status=scheduled");
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to schedule";
            setScheduleError(msg);
        } finally {
            setScheduling(false);
        }
    };

    // Save as drafts and go back
    const handleSaveAsDrafts = () => {
        router.push("/content-engine/linkedin-posts?status=draft");
    };

    const authorDisplay = getAuthorDisplayInfo(authorId, userName, userRole, userImage);

    return (
        <div className="p-8 max-w-4xl mx-auto">
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
                        <Layers className="w-6 h-6 text-sky-600" />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl font-bold text-neutral-900">
                            Bulk Create Posts
                        </h1>
                        <p className="text-neutral-600">
                            Generate multiple research-driven LinkedIn posts at once
                        </p>
                    </div>
                </div>
            </div>

            {/* Step Indicator */}
            <div className="mb-8">
                <div className="flex items-center gap-2 text-sm">
                    {(["configure", "generating", "review", "schedule"] as Step[]).map(
                        (s, i) => (
                            <div key={s} className="flex items-center gap-2">
                                {i > 0 && (
                                    <ChevronRight className="w-4 h-4 text-neutral-300" />
                                )}
                                <span
                                    className={`px-3 py-1 rounded-full ${
                                        step === s
                                            ? "bg-sky-100 text-sky-700 font-medium"
                                            : step === "schedule" && s === "review"
                                                ? "text-neutral-500"
                                                : posts.length > 0 &&
                                                    (s === "configure" || s === "generating")
                                                    ? "text-neutral-400"
                                                    : "text-neutral-400"
                                    }`}
                                >
                                    {s === "configure"
                                        ? "1. Configure"
                                        : s === "generating"
                                            ? "2. Generate"
                                            : s === "review"
                                                ? "3. Review & Edit"
                                                : "4. Schedule"}
                                </span>
                            </div>
                        )
                    )}
                </div>
            </div>

            {/* Error Display */}
            {generationError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    {generationError}
                </div>
            )}

            {/* ===== STEP 1: CONFIGURE ===== */}
            {step === "configure" && (
                <div className="bg-white rounded-xl border border-neutral-200 p-6 space-y-6">
                    <h2 className="font-semibold text-neutral-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-sky-600" />
                        Bulk Post Configuration
                    </h2>

                    {/* Number of posts */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Number of Posts
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min={1}
                                max={20}
                                value={count}
                                onChange={(e) => setCount(parseInt(e.target.value))}
                                className="flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
                            />
                            <div className="w-16 text-center">
                                <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={count}
                                    onChange={(e) => {
                                        const v = parseInt(e.target.value);
                                        if (v >= 1 && v <= 20) setCount(v);
                                    }}
                                    className="w-full px-2 py-1 text-center border border-neutral-300 rounded-lg text-sm"
                                />
                            </div>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1">
                            {count} post{count !== 1 ? "s" : ""} = {count} credit{count !== 1 ? "s" : ""}
                        </p>
                    </div>

                    {/* Theme */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Theme
                            <span className="text-neutral-400 font-normal"> (optional)</span>
                        </label>
                        <input
                            type="text"
                            value={theme}
                            onChange={(e) => setTheme(e.target.value)}
                            placeholder="e.g., AI in healthcare, startup fundraising, remote team leadership"
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                        />
                        <p className="text-xs text-neutral-500 mt-1">
                            Leave blank to let AI choose diverse topics based on your industry
                        </p>
                    </div>

                    {/* Target Audience */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Target Audience
                            <span className="text-neutral-400 font-normal"> (optional)</span>
                        </label>
                        <input
                            type="text"
                            value={targetAudience}
                            onChange={(e) => setTargetAudience(e.target.value)}
                            placeholder="e.g., Startup founders, C-suite executives"
                            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                        />
                    </div>

                    {/* Post Type */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Post Type
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                                    <p
                                        className={`text-sm font-medium ${
                                            postType === type.value
                                                ? "text-sky-700"
                                                : "text-neutral-900"
                                        }`}
                                    >
                                        {type.label}
                                    </p>
                                    <p className="text-xs text-neutral-500">
                                        {type.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tone */}
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

                    {/* Writer Profile */}
                    <WriterProfileSelector
                        selectedAuthorId={authorId}
                        onSelect={setAuthorId}
                        userName={userName}
                        userRole={userRole}
                        userImage={userImage}
                    />

                    {/* Generate Button */}
                    <div className="pt-4 border-t border-neutral-200">
                        <Button onClick={handleGenerate} className="w-full">
                            <Sparkles className="w-4 h-4" />
                            Generate {count} Post{count !== 1 ? "s" : ""}
                        </Button>
                    </div>
                </div>
            )}

            {/* ===== STEP 2: GENERATING ===== */}
            {step === "generating" && (
                <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-sky-600 mx-auto mb-4" />
                    <h2 className="font-semibold text-neutral-900 text-lg mb-2">
                        Generating {count} Posts
                    </h2>
                    <p className="text-neutral-600 text-sm mb-4">
                        Researching current trends and crafting your posts...
                    </p>
                    <div className="flex items-center justify-center gap-2 text-xs text-neutral-500">
                        <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                        Web research + AI content generation
                    </div>
                </div>
            )}

            {/* ===== STEP 3: REVIEW & EDIT ===== */}
            {step === "review" && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-semibold text-neutral-900">
                            Review & Edit ({posts.length} post{posts.length !== 1 ? "s" : ""})
                        </h2>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleSaveAsDrafts}>
                                <Save className="w-4 h-4" />
                                Save as Drafts
                            </Button>
                            <Button size="sm" onClick={handleProceedToSchedule}>
                                <CalendarClock className="w-4 h-4" />
                                Schedule Posts
                            </Button>
                        </div>
                    </div>

                    {posts.map((post, index) => (
                        <div
                            key={post.id}
                            className="bg-white rounded-xl border border-neutral-200 p-5"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-sm font-medium">
                                        {index + 1}
                                    </span>
                                    <div>
                                        <p className="text-xs text-neutral-500 font-medium">
                                            {post.angle}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <div className="w-5 h-5 rounded-full overflow-hidden bg-neutral-200">
                                                {post.authorImageUrl ? (
                                                    <Image
                                                        src={post.authorImageUrl}
                                                        alt={post.authorName}
                                                        width={20}
                                                        height={20}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-neutral-300" />
                                                )}
                                            </div>
                                            <span className="text-xs text-neutral-400">
                                                {post.authorName}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <span
                                        className={`text-xs mr-2 ${
                                            post.charCount > 3000
                                                ? "text-red-600"
                                                : "text-neutral-400"
                                        }`}
                                    >
                                        {post.charCount}/3000
                                    </span>
                                    {editingPostId !== post.id && (
                                        <>
                                            <button
                                                onClick={() => startEditing(post)}
                                                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700"
                                                title="Edit"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleRegenerate(post.id)}
                                                disabled={regeneratingId === post.id}
                                                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700 disabled:opacity-50"
                                                title="Regenerate"
                                            >
                                                {regeneratingId === post.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <RefreshCw className="w-4 h-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleRemovePost(post.id)}
                                                className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-500 hover:text-red-600"
                                                title="Remove"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {editingPostId === post.id ? (
                                <div>
                                    <textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        rows={10}
                                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 resize-none text-sm"
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button
                                            onClick={cancelEdit}
                                            className="px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 rounded-lg flex items-center gap-1"
                                        >
                                            <X className="w-3 h-3" />
                                            Cancel
                                        </button>
                                        <button
                                            onClick={saveEdit}
                                            className="px-3 py-1.5 text-sm text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg flex items-center gap-1"
                                        >
                                            <Check className="w-3 h-3" />
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-neutral-700 whitespace-pre-wrap bg-neutral-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                                    {post.content}
                                </div>
                            )}
                        </div>
                    ))}

                    {posts.length === 0 && (
                        <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                            <p className="text-neutral-600">
                                All posts have been removed. Go back to generate new ones.
                            </p>
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => setStep("configure")}
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Configure
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* ===== STEP 4: SCHEDULE ===== */}
            {step === "schedule" && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="font-semibold text-neutral-900">
                            Schedule Posts
                        </h2>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setStep("review")}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Review
                        </Button>
                    </div>

                    {/* Global scheduling options */}
                    <div className="bg-white rounded-xl border border-neutral-200 p-5 space-y-4">
                        <h3 className="text-sm font-medium text-neutral-700">
                            Posting Options
                        </h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">
                                    Start Date & Time
                                </label>
                                <input
                                    type="datetime-local"
                                    value={startDateTime}
                                    onChange={(e) => setStartDateTime(e.target.value)}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                                />
                                <p className="text-xs text-neutral-500 mt-1">
                                    First post publishes at this time, then one per day after
                                </p>
                            </div>

                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleGenerateSchedule}
                                    className="w-full"
                                >
                                    <CalendarClock className="w-4 h-4" />
                                    Generate Schedule
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">
                                    Post As
                                </label>
                                <select
                                    value={postAs}
                                    onChange={(e) => setPostAs(e.target.value)}
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                                >
                                    <option value="personal" disabled={!linkedInStatus?.connected}>
                                        Personal Profile
                                        {!linkedInStatus?.connected ? " (not connected)" : ""}
                                    </option>
                                    {linkedInOrgStatus?.orgs?.map((org) => (
                                        <option key={org.id} value={org.id}>
                                            {org.name} (Organization)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-neutral-600 mb-1">
                                    Visibility
                                </label>
                                <select
                                    value={visibility}
                                    onChange={(e) =>
                                        setVisibility(
                                            e.target.value as "PUBLIC" | "CONNECTIONS"
                                        )
                                    }
                                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                                >
                                    <option value="PUBLIC">Public</option>
                                    <option value="CONNECTIONS">Connections Only</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Per-post schedule */}
                    <div className="space-y-3">
                        {posts.map((post, index) => {
                            const schedule = schedules.find(
                                (s) => s.postId === post.id
                            );
                            const suggestedDate = schedule?.suggestedDate
                                ? new Date(schedule.suggestedDate)
                                : null;

                            return (
                                <div
                                    key={post.id}
                                    className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-4"
                                >
                                    <span className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-sm font-medium flex-shrink-0">
                                        {index + 1}
                                    </span>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-neutral-700 truncate">
                                            {post.content.substring(0, 80)}...
                                        </p>
                                        <p className="text-xs text-neutral-400">
                                            {post.angle}
                                        </p>
                                    </div>

                                    <div className="flex-shrink-0">
                                        <input
                                            type="datetime-local"
                                            value={
                                                suggestedDate
                                                    ? formatDateTimeLocal(suggestedDate)
                                                    : ""
                                            }
                                            onChange={(e) =>
                                                updateScheduleDate(
                                                    post.id,
                                                    new Date(e.target.value).toISOString()
                                                )
                                            }
                                            className="px-3 py-1.5 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Schedule error */}
                    {scheduleError && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            {scheduleError}
                        </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={handleSaveAsDrafts}>
                            <Save className="w-4 h-4" />
                            Save as Drafts Only
                        </Button>
                        <Button
                            onClick={handleScheduleAll}
                            disabled={
                                scheduling ||
                                schedules.length === 0 ||
                                (!linkedInStatus?.connected && postAs === "personal")
                            }
                        >
                            {scheduling ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Scheduling...
                                </>
                            ) : (
                                <>
                                    <CalendarClock className="w-4 h-4" />
                                    Schedule All {posts.length} Posts
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Format a Date for datetime-local input value
 */
function formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}
