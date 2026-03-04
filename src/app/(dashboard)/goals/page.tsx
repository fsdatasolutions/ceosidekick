"use client";

import { useState, useEffect } from "react";
import {
    Target,
    Plus,
    Loader2,
    Sparkles,
    ChevronDown,
    ChevronUp,
    Check,
    Pencil,
    Trash2,
    Archive,
    X,
    Calendar,
    AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================
// TYPES
// ============================================

interface GoalStep {
    id: string;
    goalId: string;
    stepNumber: number;
    title: string;
    description: string | null;
    timeframe: string | null;
    completed: boolean;
    completedAt: string | null;
}

interface Goal {
    id: string;
    title: string;
    description: string | null;
    category: string | null;
    status: string;
    progress: number;
    targetDate: string | null;
    aiModel: string | null;
    creditCost: number | null;
    createdAt: string;
    steps: GoalStep[];
}

// ============================================
// CONSTANTS
// ============================================

const CATEGORIES = [
    { value: "revenue", label: "Revenue", color: "bg-green-100 text-green-700" },
    { value: "product", label: "Product", color: "bg-blue-100 text-blue-700" },
    { value: "team", label: "Team", color: "bg-purple-100 text-purple-700" },
    { value: "operations", label: "Operations", color: "bg-orange-100 text-orange-700" },
    { value: "marketing", label: "Marketing", color: "bg-pink-100 text-pink-700" },
];

const STATUS_FILTERS = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "archived", label: "Archived" },
];

function getCategoryInfo(category: string | null) {
    return CATEGORIES.find((c) => c.value === category) || { value: "", label: "General", color: "bg-neutral-100 text-neutral-600" };
}

function formatDate(dateStr: string | null) {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function GoalsPage() {
    // State
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");
    const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
    const [editingGoalId, setEditingGoalId] = useState<string | null>(null);

    // New Goal modal
    const [showNewGoal, setShowNewGoal] = useState(false);
    const [goalDescription, setGoalDescription] = useState("");
    const [generating, setGenerating] = useState(false);
    const [generatedPlan, setGeneratedPlan] = useState<{
        title: string;
        category: string;
        targetDate: string;
        steps: { title: string; description: string; timeframe: string }[];
        aiModel?: string;
        creditCost?: number;
    } | null>(null);
    const [saving, setSaving] = useState(false);

    // Edit state for generated plan (pre-save)
    const [editTitle, setEditTitle] = useState("");
    const [editCategory, setEditCategory] = useState("");
    const [editTargetDate, setEditTargetDate] = useState("");
    const [editSteps, setEditSteps] = useState<{ title: string; description: string; timeframe: string }[]>([]);

    // Edit state for saved goals
    const [savedEditTitle, setSavedEditTitle] = useState("");
    const [savedEditCategory, setSavedEditCategory] = useState("");
    const [savedEditTargetDate, setSavedEditTargetDate] = useState("");
    const [savedEditSteps, setSavedEditSteps] = useState<GoalStep[]>([]);
    const [savingEdit, setSavingEdit] = useState(false);

    // Error/info
    const [error, setError] = useState<string | null>(null);

    // ============================================
    // FETCH GOALS
    // ============================================

    const fetchGoals = async () => {
        try {
            const url = statusFilter === "all"
                ? "/api/goals"
                : `/api/goals?status=${statusFilter}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch goals");
            const data = await res.json();
            setGoals(data.goals || []);
        } catch (err) {
            console.error("Error fetching goals:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchGoals();
    }, [statusFilter]);

    // ============================================
    // GENERATE PLAN
    // ============================================

    const handleGenerate = async () => {
        if (goalDescription.trim().length < 10) {
            setError("Please describe your goal in at least 10 characters.");
            return;
        }

        setGenerating(true);
        setError(null);

        try {
            const res = await fetch("/api/goals/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ description: goalDescription.trim() }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to generate plan");
            }

            const plan = data.plan;
            setGeneratedPlan({ ...plan, aiModel: data.aiModel, creditCost: data.creditCost });
            setEditTitle(plan.title);
            setEditCategory(plan.category || "revenue");
            setEditTargetDate(plan.targetDate ? plan.targetDate.split("T")[0] : "");
            setEditSteps(plan.steps.map((s: { title: string; description: string; timeframe: string }) => ({ ...s })));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate plan");
        } finally {
            setGenerating(false);
        }
    };

    // ============================================
    // SAVE GOAL
    // ============================================

    const handleSave = async () => {
        if (!editTitle.trim()) {
            setError("Goal title is required.");
            return;
        }
        if (editSteps.length === 0) {
            setError("At least one step is required.");
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const res = await fetch("/api/goals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editTitle.trim(),
                    description: goalDescription.trim(),
                    category: editCategory,
                    targetDate: editTargetDate || null,
                    aiModel: generatedPlan?.aiModel || null,
                    creditCost: generatedPlan?.creditCost || null,
                    steps: editSteps.filter((s) => s.title.trim()),
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to save goal");
            }

            // Reset modal state and refresh
            setShowNewGoal(false);
            setGoalDescription("");
            setGeneratedPlan(null);
            setEditSteps([]);
            fetchGoals();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save goal");
        } finally {
            setSaving(false);
        }
    };

    // ============================================
    // TOGGLE STEP COMPLETION
    // ============================================

    const toggleStep = async (goalId: string, step: GoalStep) => {
        // Optimistic update
        setGoals((prev) =>
            prev.map((g) => {
                if (g.id !== goalId) return g;
                const updatedSteps = g.steps.map((s) =>
                    s.id === step.id ? { ...s, completed: !s.completed } : s
                );
                const completedCount = updatedSteps.filter((s) => s.completed).length;
                const progress = Math.round((completedCount / updatedSteps.length) * 100);
                return {
                    ...g,
                    steps: updatedSteps,
                    progress,
                    status: completedCount === updatedSteps.length ? "completed" : "active",
                };
            })
        );

        try {
            await fetch(`/api/goals/${goalId}/steps/${step.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ completed: !step.completed }),
            });
        } catch {
            // Revert on error
            fetchGoals();
        }
    };

    // ============================================
    // ARCHIVE / DELETE GOAL
    // ============================================

    const archiveGoal = async (goalId: string) => {
        try {
            await fetch(`/api/goals/${goalId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "archived" }),
            });
            fetchGoals();
        } catch (err) {
            console.error("Failed to archive goal:", err);
        }
    };

    const deleteGoal = async (goalId: string) => {
        if (!confirm("Are you sure you want to delete this goal? This cannot be undone.")) return;

        try {
            await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
            if (expandedGoalId === goalId) setExpandedGoalId(null);
            if (editingGoalId === goalId) setEditingGoalId(null);
            fetchGoals();
        } catch (err) {
            console.error("Failed to delete goal:", err);
        }
    };

    // ============================================
    // EDIT SAVED GOAL
    // ============================================

    const startEditing = (goal: Goal) => {
        setEditingGoalId(goal.id);
        setSavedEditTitle(goal.title);
        setSavedEditCategory(goal.category || "");
        setSavedEditTargetDate(goal.targetDate ? goal.targetDate.split("T")[0] : "");
        setSavedEditSteps(goal.steps.map((s) => ({ ...s })));
    };

    const cancelEditing = () => {
        setEditingGoalId(null);
    };

    const saveEditing = async (goalId: string) => {
        setSavingEdit(true);
        setError(null);

        try {
            // Update goal metadata
            await fetch(`/api/goals/${goalId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: savedEditTitle.trim(),
                    category: savedEditCategory || null,
                    targetDate: savedEditTargetDate || null,
                }),
            });

            // Find the original goal to compare steps
            const originalGoal = goals.find((g) => g.id === goalId);
            if (!originalGoal) return;

            const originalStepIds = new Set(originalGoal.steps.map((s) => s.id));
            const editedStepIds = new Set(savedEditSteps.filter((s) => s.id).map((s) => s.id));

            // Delete removed steps
            for (const origStep of originalGoal.steps) {
                if (!editedStepIds.has(origStep.id)) {
                    await fetch(`/api/goals/${goalId}/steps/${origStep.id}`, { method: "DELETE" });
                }
            }

            // Update existing steps and add new ones
            for (let i = 0; i < savedEditSteps.length; i++) {
                const step = savedEditSteps[i];
                if (originalStepIds.has(step.id)) {
                    // Update existing step
                    await fetch(`/api/goals/${goalId}/steps/${step.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            title: step.title.trim(),
                            description: step.description,
                            timeframe: step.timeframe,
                            stepNumber: i + 1,
                        }),
                    });
                } else {
                    // Add new step
                    await fetch(`/api/goals/${goalId}/steps`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            title: step.title.trim(),
                            description: step.description,
                            timeframe: step.timeframe,
                        }),
                    });
                }
            }

            setEditingGoalId(null);
            fetchGoals();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save changes");
        } finally {
            setSavingEdit(false);
        }
    };

    // ============================================
    // RENDER
    // ============================================

    return (
        <div className="p-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
                        Goals
                    </h1>
                    <p className="text-neutral-600">
                        Set goals and track your progress with AI-generated action plans.
                    </p>
                </div>
                <Button onClick={() => { setShowNewGoal(true); setError(null); }}>
                    <Plus className="w-5 h-5" />
                    New Goal
                </Button>
            </div>

            {/* Error */}
            {error && !showNewGoal && (
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

            {/* Filter Tabs */}
            <div className="bg-white rounded-xl border border-neutral-200 p-1 mb-6 inline-flex">
                {STATUS_FILTERS.map((filter) => (
                    <button
                        key={filter.value}
                        onClick={() => setStatusFilter(filter.value)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                            statusFilter === filter.value
                                ? "bg-primary-red text-white"
                                : "text-neutral-600 hover:text-neutral-900"
                        }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* Goal List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                </div>
            ) : goals.length === 0 ? (
                <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                    <Target className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg text-neutral-900 mb-2">
                        {statusFilter === "all" ? "Set your first goal" : `No ${statusFilter} goals`}
                    </h3>
                    <p className="text-neutral-500 mb-6">
                        {statusFilter === "all"
                            ? "Describe what you want to achieve and AI will create an actionable step-by-step plan."
                            : `You don't have any ${statusFilter} goals yet.`}
                    </p>
                    {statusFilter === "all" && (
                        <Button onClick={() => { setShowNewGoal(true); setError(null); }}>
                            <Plus className="w-5 h-5" />
                            New Goal
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {goals.map((goal) => {
                        const isExpanded = expandedGoalId === goal.id;
                        const isEditing = editingGoalId === goal.id;
                        const catInfo = getCategoryInfo(goal.category);
                        const completedSteps = goal.steps.filter((s) => s.completed).length;
                        const totalSteps = goal.steps.length;

                        return (
                            <div
                                key={goal.id}
                                className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
                            >
                                {/* Goal Card Header */}
                                <button
                                    onClick={() => {
                                        setExpandedGoalId(isExpanded ? null : goal.id);
                                        if (isEditing && !isExpanded) setEditingGoalId(null);
                                    }}
                                    className="w-full p-5 text-left hover:bg-neutral-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${catInfo.color}`}>
                                                    {catInfo.label}
                                                </span>
                                                {goal.status === "completed" && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                        Completed
                                                    </span>
                                                )}
                                                {goal.status === "archived" && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-500">
                                                        Archived
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-neutral-900 mb-1">
                                                {goal.title}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm text-neutral-500">
                                                <span>{completedSteps} of {totalSteps} steps</span>
                                                {goal.targetDate && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        {formatDate(goal.targetDate)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {/* Progress circle */}
                                            <div className="relative w-12 h-12">
                                                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                                                    <circle
                                                        cx="18" cy="18" r="15.5"
                                                        fill="none"
                                                        stroke="#e5e7eb"
                                                        strokeWidth="3"
                                                    />
                                                    <circle
                                                        cx="18" cy="18" r="15.5"
                                                        fill="none"
                                                        stroke={goal.progress === 100 ? "#22c55e" : "#ef4444"}
                                                        strokeWidth="3"
                                                        strokeDasharray={`${goal.progress * 0.9738} 97.38`}
                                                        strokeLinecap="round"
                                                    />
                                                </svg>
                                                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-neutral-700">
                                                    {goal.progress}%
                                                </span>
                                            </div>
                                            {isExpanded ? (
                                                <ChevronUp className="w-5 h-5 text-neutral-400" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-neutral-400" />
                                            )}
                                        </div>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="mt-3 w-full bg-neutral-100 rounded-full h-1.5">
                                        <div
                                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                                goal.progress === 100 ? "bg-green-500" : "bg-primary-red"
                                            }`}
                                            style={{ width: `${goal.progress}%` }}
                                        />
                                    </div>
                                </button>

                                {/* Expanded View */}
                                {isExpanded && (
                                    <div className="border-t border-neutral-200 p-5">
                                        {/* Action buttons */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex gap-2">
                                                {!isEditing ? (
                                                    <button
                                                        onClick={() => startEditing(goal)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                        Edit
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => saveEditing(goal.id)}
                                                            disabled={savingEdit}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary-red rounded-lg hover:bg-primary-red-hover transition-colors disabled:opacity-50"
                                                        >
                                                            {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                            Save Changes
                                                        </button>
                                                        <button
                                                            onClick={cancelEditing}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                            {!isEditing && (
                                                <div className="flex gap-2">
                                                    {goal.status !== "archived" && (
                                                        <button
                                                            onClick={() => archiveGoal(goal.id)}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-700 bg-neutral-100 rounded-lg hover:bg-neutral-200 transition-colors"
                                                        >
                                                            <Archive className="w-3.5 h-3.5" />
                                                            Archive
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteGoal(goal.id)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-500 hover:text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Edit mode for goal metadata */}
                                        {isEditing && (
                                            <div className="mb-4 space-y-3 p-4 bg-neutral-50 rounded-lg">
                                                <div>
                                                    <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
                                                    <input
                                                        type="text"
                                                        value={savedEditTitle}
                                                        onChange={(e) => setSavedEditTitle(e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red text-sm"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                                                        <select
                                                            value={savedEditCategory}
                                                            onChange={(e) => setSavedEditCategory(e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red text-sm bg-white"
                                                        >
                                                            {CATEGORIES.map((c) => (
                                                                <option key={c.value} value={c.value}>{c.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-neutral-700 mb-1">Target Date</label>
                                                        <input
                                                            type="date"
                                                            value={savedEditTargetDate}
                                                            onChange={(e) => setSavedEditTargetDate(e.target.value)}
                                                            className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Steps list */}
                                        <div className="space-y-2">
                                            {(isEditing ? savedEditSteps : goal.steps).map((step, index) => (
                                                <div
                                                    key={step.id || `new-${index}`}
                                                    className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                                                        isEditing ? "bg-neutral-50" : step.completed ? "bg-green-50/50" : "hover:bg-neutral-50"
                                                    }`}
                                                >
                                                    {!isEditing ? (
                                                        <>
                                                            {/* Checkbox */}
                                                            <button
                                                                onClick={() => toggleStep(goal.id, step as GoalStep)}
                                                                className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center border-2 flex-shrink-0 transition-colors ${
                                                                    step.completed
                                                                        ? "bg-green-500 border-green-500 text-white"
                                                                        : "border-neutral-300 hover:border-primary-red"
                                                                }`}
                                                            >
                                                                {step.completed && <Check className="w-3 h-3" />}
                                                            </button>
                                                            {/* Step info */}
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm font-medium ${step.completed ? "line-through text-neutral-400" : "text-neutral-900"}`}>
                                                                    {step.title}
                                                                </p>
                                                                {step.description && (
                                                                    <p className="text-xs text-neutral-500 mt-0.5">{step.description}</p>
                                                                )}
                                                            </div>
                                                            {step.timeframe && (
                                                                <span className="px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-500 flex-shrink-0">
                                                                    {step.timeframe}
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <>
                                                            {/* Edit mode for steps */}
                                                            <span className="mt-2 text-xs font-semibold text-neutral-400 w-5 text-center flex-shrink-0">
                                                                {index + 1}
                                                            </span>
                                                            <div className="flex-1 space-y-2">
                                                                <input
                                                                    type="text"
                                                                    value={step.title}
                                                                    onChange={(e) => {
                                                                        const updated = [...savedEditSteps];
                                                                        updated[index] = { ...updated[index], title: e.target.value };
                                                                        setSavedEditSteps(updated);
                                                                    }}
                                                                    placeholder="Step title"
                                                                    className="w-full px-3 py-1.5 rounded border border-neutral-200 focus:outline-none focus:border-primary-red text-sm"
                                                                />
                                                                <div className="flex gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={step.description || ""}
                                                                        onChange={(e) => {
                                                                            const updated = [...savedEditSteps];
                                                                            updated[index] = { ...updated[index], description: e.target.value };
                                                                            setSavedEditSteps(updated);
                                                                        }}
                                                                        placeholder="Description (optional)"
                                                                        className="flex-1 px-3 py-1.5 rounded border border-neutral-200 focus:outline-none focus:border-primary-red text-sm"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={step.timeframe || ""}
                                                                        onChange={(e) => {
                                                                            const updated = [...savedEditSteps];
                                                                            updated[index] = { ...updated[index], timeframe: e.target.value };
                                                                            setSavedEditSteps(updated);
                                                                        }}
                                                                        placeholder="Timeframe"
                                                                        className="w-28 px-3 py-1.5 rounded border border-neutral-200 focus:outline-none focus:border-primary-red text-sm"
                                                                    />
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    setSavedEditSteps(savedEditSteps.filter((_, i) => i !== index));
                                                                }}
                                                                className="mt-1.5 p-1 text-neutral-400 hover:text-red-500 transition-colors"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Add step button in edit mode */}
                                            {isEditing && (
                                                <button
                                                    onClick={() => {
                                                        setSavedEditSteps([
                                                            ...savedEditSteps,
                                                            {
                                                                id: `new-${Date.now()}`,
                                                                goalId: goal.id,
                                                                stepNumber: savedEditSteps.length + 1,
                                                                title: "",
                                                                description: null,
                                                                timeframe: null,
                                                                completed: false,
                                                                completedAt: null,
                                                            },
                                                        ]);
                                                    }}
                                                    className="w-full py-2 text-sm font-medium text-neutral-500 hover:text-primary-red border-2 border-dashed border-neutral-200 hover:border-primary-red/30 rounded-lg transition-colors"
                                                >
                                                    + Add Step
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ============================================ */}
            {/* NEW GOAL MODAL */}
            {/* ============================================ */}
            {showNewGoal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-[10vh] px-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl mb-8">
                        {/* Modal header */}
                        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
                            <h2 className="font-display text-xl font-bold text-neutral-900">
                                {generatedPlan ? "Review Your Plan" : "Create a New Goal"}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowNewGoal(false);
                                    setGoalDescription("");
                                    setGeneratedPlan(null);
                                    setEditSteps([]);
                                    setError(null);
                                }}
                                className="p-2 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal body */}
                        <div className="p-6">
                            {/* Error in modal */}
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {!generatedPlan ? (
                                <>
                                    {/* Step 1: Describe the goal */}
                                    <p className="text-sm text-neutral-600 mb-4">
                                        Describe what you want to achieve. AI will create a step-by-step action plan for you.
                                    </p>
                                    <textarea
                                        rows={4}
                                        value={goalDescription}
                                        onChange={(e) => setGoalDescription(e.target.value)}
                                        placeholder='e.g. "Grow monthly revenue to $50K by end of Q2 through new customer acquisition and upselling existing accounts"'
                                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red resize-none mb-4"
                                        disabled={generating}
                                    />
                                    <Button
                                        onClick={handleGenerate}
                                        disabled={generating || goalDescription.trim().length < 10}
                                        className="w-full"
                                    >
                                        {generating ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                AI is creating your action plan...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5" />
                                                Generate Plan
                                            </>
                                        )}
                                    </Button>
                                </>
                            ) : (
                                <>
                                    {/* Step 2: Review & edit generated plan */}
                                    <div className="space-y-4">
                                        {/* Title */}
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-1">Goal Title</label>
                                            <input
                                                type="text"
                                                value={editTitle}
                                                onChange={(e) => setEditTitle(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red"
                                            />
                                        </div>

                                        {/* Category & Target Date */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">Category</label>
                                                <select
                                                    value={editCategory}
                                                    onChange={(e) => setEditCategory(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red bg-white"
                                                >
                                                    {CATEGORIES.map((c) => (
                                                        <option key={c.value} value={c.value}>{c.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-neutral-700 mb-1">Target Date</label>
                                                <input
                                                    type="date"
                                                    value={editTargetDate}
                                                    onChange={(e) => setEditTargetDate(e.target.value)}
                                                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red"
                                                />
                                            </div>
                                        </div>

                                        {/* Steps */}
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-700 mb-2">Action Steps</label>
                                            <div className="space-y-2">
                                                {editSteps.map((step, index) => (
                                                    <div key={index} className="flex items-start gap-2 p-3 bg-neutral-50 rounded-lg">
                                                        <span className="mt-2 text-xs font-semibold text-neutral-400 w-5 text-center flex-shrink-0">
                                                            {index + 1}
                                                        </span>
                                                        <div className="flex-1 space-y-2">
                                                            <input
                                                                type="text"
                                                                value={step.title}
                                                                onChange={(e) => {
                                                                    const updated = [...editSteps];
                                                                    updated[index] = { ...updated[index], title: e.target.value };
                                                                    setEditSteps(updated);
                                                                }}
                                                                placeholder="Step title"
                                                                className="w-full px-3 py-1.5 rounded border border-neutral-200 focus:outline-none focus:border-primary-red text-sm"
                                                            />
                                                            <div className="flex gap-2">
                                                                <input
                                                                    type="text"
                                                                    value={step.description}
                                                                    onChange={(e) => {
                                                                        const updated = [...editSteps];
                                                                        updated[index] = { ...updated[index], description: e.target.value };
                                                                        setEditSteps(updated);
                                                                    }}
                                                                    placeholder="Description"
                                                                    className="flex-1 px-3 py-1.5 rounded border border-neutral-200 focus:outline-none focus:border-primary-red text-sm"
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={step.timeframe}
                                                                    onChange={(e) => {
                                                                        const updated = [...editSteps];
                                                                        updated[index] = { ...updated[index], timeframe: e.target.value };
                                                                        setEditSteps(updated);
                                                                    }}
                                                                    placeholder="Timeframe"
                                                                    className="w-28 px-3 py-1.5 rounded border border-neutral-200 focus:outline-none focus:border-primary-red text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setEditSteps(editSteps.filter((_, i) => i !== index))}
                                                            className="mt-1.5 p-1 text-neutral-400 hover:text-red-500 transition-colors"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}

                                                {/* Add Step */}
                                                <button
                                                    onClick={() =>
                                                        setEditSteps([...editSteps, { title: "", description: "", timeframe: "" }])
                                                    }
                                                    className="w-full py-2 text-sm font-medium text-neutral-500 hover:text-primary-red border-2 border-dashed border-neutral-200 hover:border-primary-red/30 rounded-lg transition-colors"
                                                >
                                                    + Add Step
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Save / Back buttons */}
                                    <div className="flex gap-3 mt-6">
                                        <button
                                            onClick={() => {
                                                setGeneratedPlan(null);
                                                setEditSteps([]);
                                            }}
                                            className="px-4 py-2.5 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors"
                                        >
                                            ← Back
                                        </button>
                                        <Button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex-1"
                                        >
                                            {saving ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Check className="w-5 h-5" />
                                                    Save Goal
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
