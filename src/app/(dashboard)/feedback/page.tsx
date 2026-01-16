"use client";

import { useState, useEffect } from "react";
import {
    Bug,
    Lightbulb,
    Send,
    CheckCircle,
    Clock,
    AlertCircle,
    ChevronDown,
    Loader2,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type FeedbackType = "bug" | "feature_request";
type FeedbackStatus = "open" | "in_progress" | "resolved" | "closed";
type FeedbackPriority = "low" | "medium" | "high" | "critical";

interface FeedbackItem {
    id: string;
    type: FeedbackType;
    title: string;
    description: string;
    status: FeedbackStatus;
    priority: FeedbackPriority;
    createdAt: string;
    stepsToReproduce?: string;
    expectedBehavior?: string;
    actualBehavior?: string;
    useCase?: string;
}

const priorityOptions: { value: FeedbackPriority; label: string; color: string }[] = [
    { value: "low", label: "Low", color: "bg-gray-100 text-gray-700" },
    { value: "medium", label: "Medium", color: "bg-blue-100 text-blue-700" },
    { value: "high", label: "High", color: "bg-orange-100 text-orange-700" },
    { value: "critical", label: "Critical", color: "bg-red-100 text-red-700" },
];

const statusConfig: Record<FeedbackStatus, { label: string; color: string; icon: typeof Clock }> = {
    open: { label: "Open", color: "bg-yellow-100 text-yellow-700", icon: Clock },
    in_progress: { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: Loader2 },
    resolved: { label: "Resolved", color: "bg-green-100 text-green-700", icon: CheckCircle },
    closed: { label: "Closed", color: "bg-gray-100 text-gray-700", icon: X },
};

export default function FeedbackPage() {
    const [activeTab, setActiveTab] = useState<FeedbackType>("bug");
    const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<FeedbackPriority>("medium");

    // Bug-specific fields
    const [stepsToReproduce, setStepsToReproduce] = useState("");
    const [expectedBehavior, setExpectedBehavior] = useState("");
    const [actualBehavior, setActualBehavior] = useState("");

    // Feature request specific
    const [useCase, setUseCase] = useState("");

    // Fetch user's feedback
    const fetchFeedback = async () => {
        try {
            const res = await fetch("/api/feedback");
            if (!res.ok) throw new Error("Failed to fetch feedback");
            const data = await res.json();
            setFeedbackList(data.feedback || []);
        } catch (err) {
            console.error("Error fetching feedback:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedback();
    }, []);

    // Reset form
    const resetForm = () => {
        setTitle("");
        setDescription("");
        setPriority("medium");
        setStepsToReproduce("");
        setExpectedBehavior("");
        setActualBehavior("");
        setUseCase("");
    };

    // Submit feedback
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const payload: Record<string, unknown> = {
                type: activeTab,
                title,
                description,
                priority,
                metadata: {
                    userAgent: navigator.userAgent,
                    url: window.location.href,
                    timestamp: new Date().toISOString(),
                },
            };

            if (activeTab === "bug") {
                payload.stepsToReproduce = stepsToReproduce;
                payload.expectedBehavior = expectedBehavior;
                payload.actualBehavior = actualBehavior;
            } else {
                payload.useCase = useCase;
            }

            const res = await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to submit feedback");
            }

            setSuccess(true);
            resetForm();
            fetchFeedback();

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to submit");
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
                    Feedback & Bug Reports
                </h1>
                <p className="text-neutral-600">
                    Help us improve CEO Sidekick by reporting bugs or requesting new features.
                </p>
            </div>

            {/* Success Message */}
            {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    Thank you for your feedback! We'll review it shortly.
                </div>
            )}

            {/* Error Message */}
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

            {/* Tab Selector */}
            <div className="bg-white rounded-xl border border-neutral-200 p-1 mb-6 inline-flex">
                <button
                    onClick={() => setActiveTab("bug")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === "bug"
                            ? "bg-primary-red text-white"
                            : "text-neutral-600 hover:text-neutral-900"
                    }`}
                >
                    <Bug className="w-4 h-4" />
                    Report a Bug
                </button>
                <button
                    onClick={() => setActiveTab("feature_request")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeTab === "feature_request"
                            ? "bg-primary-red text-white"
                            : "text-neutral-600 hover:text-neutral-900"
                    }`}
                >
                    <Lightbulb className="w-4 h-4" />
                    Request a Feature
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 p-6 mb-8">
                <h2 className="font-semibold text-lg text-neutral-900 mb-4">
                    {activeTab === "bug" ? "Bug Report" : "Feature Request"}
                </h2>

                {/* Title */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={activeTab === "bug" ? "Brief description of the bug" : "What feature would you like?"}
                        className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red"
                    />
                </div>

                {/* Description */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        required
                        rows={4}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder={activeTab === "bug" ? "Detailed description of the issue..." : "Describe the feature you'd like..."}
                        className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red resize-none"
                    />
                </div>

                {/* Priority */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Priority
                    </label>
                    <div className="relative">
                        <select
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as FeedbackPriority)}
                            className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red appearance-none bg-white"
                        >
                            {priorityOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 pointer-events-none" />
                    </div>
                </div>

                {/* Bug-specific fields */}
                {activeTab === "bug" && (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                Steps to Reproduce
                            </label>
                            <textarea
                                rows={3}
                                value={stepsToReproduce}
                                onChange={(e) => setStepsToReproduce(e.target.value)}
                                placeholder="1. Go to...&#10;2. Click on...&#10;3. See error"
                                className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Expected Behavior
                                </label>
                                <textarea
                                    rows={2}
                                    value={expectedBehavior}
                                    onChange={(e) => setExpectedBehavior(e.target.value)}
                                    placeholder="What should happen..."
                                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1">
                                    Actual Behavior
                                </label>
                                <textarea
                                    rows={2}
                                    value={actualBehavior}
                                    onChange={(e) => setActualBehavior(e.target.value)}
                                    placeholder="What actually happens..."
                                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red resize-none"
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* Feature request specific */}
                {activeTab === "feature_request" && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Use Case
                        </label>
                        <textarea
                            rows={3}
                            value={useCase}
                            onChange={(e) => setUseCase(e.target.value)}
                            placeholder="Describe how you would use this feature and why it would be valuable..."
                            className="w-full px-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red resize-none"
                        />
                    </div>
                )}

                {/* Submit Button */}
                <Button type="submit" disabled={submitting} className="w-full md:w-auto">
                    {submitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Submit {activeTab === "bug" ? "Bug Report" : "Feature Request"}
                        </>
                    )}
                </Button>
            </form>

            {/* Previous Submissions */}
            <div>
                <h2 className="font-semibold text-lg text-neutral-900 mb-4">
                    Your Submissions
                </h2>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                    </div>
                ) : feedbackList.length === 0 ? (
                    <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-neutral-500">
                        You haven't submitted any feedback yet.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {feedbackList.map((item) => {
                            const statusInfo = statusConfig[item.status];
                            const StatusIcon = statusInfo.icon;
                            const priorityInfo = priorityOptions.find((p) => p.value === item.priority);

                            return (
                                <div
                                    key={item.id}
                                    className="bg-white rounded-xl border border-neutral-200 p-4 hover:border-neutral-300 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {item.type === "bug" ? (
                                                    <Bug className="w-4 h-4 text-red-500 flex-shrink-0" />
                                                ) : (
                                                    <Lightbulb className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                                                )}
                                                <h3 className="font-medium text-neutral-900 truncate">
                                                    {item.title}
                                                </h3>
                                            </div>
                                            <p className="text-sm text-neutral-600 line-clamp-2">
                                                {item.description}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                      </span>
                                            {priorityInfo && (
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium ${priorityInfo.color}`}
                                                >
                          {priorityInfo.label}
                        </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs text-neutral-400">
                                        Submitted {formatDate(item.createdAt)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}