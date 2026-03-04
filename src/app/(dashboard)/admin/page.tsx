// src/app/(dashboard)/admin/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
    Users,
    MessageSquare,
    MessagesSquare,
    TrendingUp,
    DollarSign,
    UserPlus,
    Activity,
    Crown,
    Loader2,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    ChevronRight,
    Search,
    Shield,
    ShieldOff,
    Receipt,
    Bug,
    Lightbulb,
    Save,
    Info,
} from "lucide-react";

interface UserStats {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
    createdAt: string | null;
    totalMessages: number;
    conversationCount: number;
    tier: string;
    subscriptionStatus: string;
    currentMonthUsage: number;
    currentMonthLimit: number;
    bonusCredits: number;
}

interface TierDistribution {
    tier: string;
    count: number;
}

interface AdminStats {
    overview: {
        totalUsers: number;
        totalConversations: number;
        totalMessages: number;
        userMessages: number;
        assistantMessages: number;
        avgMessagesPerUser: number;
        avgConversationsPerUser: number;
        recentSignups: number;
        activeUsers: number;
        estimatedMRR: number;
    };
    tierDistribution: TierDistribution[];
    users: UserStats[];
    currentPeriod: string;
}

// API Costs interfaces
interface ModelBreakdown {
    model: string;
    inputTokens: number;
    outputTokens: number;
    requests: number;
    estimatedCost: number;
}

interface TypeBreakdown {
    type: string;
    inputTokens: number;
    outputTokens: number;
    requests: number;
    estimatedCost: number;
}

interface MonthCost {
    month: string;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalRequests: number;
    estimatedCost: number;
    byModel: ModelBreakdown[];
    byType: TypeBreakdown[];
}

interface CreditUsageMonth {
    month: string;
    totalCreditsUsed: number;
    activeUsers: number;
    totalUsers: number;
    estimatedTokens: number;
    estimatedCost: number;
}

interface ApiCostsData {
    months: MonthCost[];
    creditUsage: CreditUsageMonth[];
    pricing: Record<string, { input: number; output: number }>;
    tokensPerCredit: number;
}

// Feedback interfaces
interface FeedbackItem {
    id: string;
    type: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    stepsToReproduce: string | null;
    expectedBehavior: string | null;
    actualBehavior: string | null;
    useCase: string | null;
    pageUrl: string | null;
    adminNotes: string | null;
    resolvedAt: string | null;
    createdAt: string;
    updatedAt: string;
    userName: string | null;
    userEmail: string | null;
    userImage: string | null;
}

interface FeedbackCounts {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
}

type SortField = "totalMessages" | "currentMonthUsage" | "conversationCount" | "createdAt" | "name";
type SortDirection = "asc" | "desc";

// Stat Card Component
function StatCard({
                      icon: Icon,
                      label,
                      value,
                      color,
                      small = false,
                  }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    color: string;
    small?: boolean;
}) {
    const colorClasses: Record<string, string> = {
        blue: "bg-blue-100 text-blue-600",
        green: "bg-green-100 text-green-600",
        purple: "bg-purple-100 text-purple-600",
        amber: "bg-amber-100 text-amber-600",
        teal: "bg-teal-100 text-teal-600",
        indigo: "bg-indigo-100 text-indigo-600",
        pink: "bg-pink-100 text-pink-600",
        orange: "bg-orange-100 text-orange-600",
    };

    return (
        <div className={`bg-white rounded-xl border border-neutral-200 ${small ? 'p-4' : 'p-6'}`}>
            <div className="flex items-center gap-3">
                <div className={`${small ? 'w-10 h-10' : 'w-12 h-12'} rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
                    <Icon className={small ? "w-5 h-5" : "w-6 h-6"} />
                </div>
                <div>
                    <p className={`font-bold text-neutral-900 ${small ? 'text-xl' : 'text-2xl'}`}>
                        {typeof value === "number" ? value.toLocaleString() : value}
                    </p>
                    <p className={`text-neutral-500 ${small ? 'text-xs' : 'text-sm'}`}>{label}</p>
                </div>
            </div>
        </div>
    );
}

export default function AdminPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState<SortField>("totalMessages");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [togglingRole, setTogglingRole] = useState<string | null>(null);

    // API Costs state
    const [apiCosts, setApiCosts] = useState<ApiCostsData | null>(null);
    const [apiCostsLoading, setApiCostsLoading] = useState(true);

    // Feedback state
    const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
    const [feedbackCounts, setFeedbackCounts] = useState<FeedbackCounts>({ total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });
    const [feedbackLoading, setFeedbackLoading] = useState(true);
    const [feedbackStatusFilter, setFeedbackStatusFilter] = useState<string>("all");
    const [feedbackTypeFilter, setFeedbackTypeFilter] = useState<string>("all");
    const [feedbackPriorityFilter, setFeedbackPriorityFilter] = useState<string>("all");
    const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);
    const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
    const [editingStatus, setEditingStatus] = useState<Record<string, string>>({});
    const [savingFeedback, setSavingFeedback] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
        fetchApiCosts();
        fetchFeedback();
    }, []);

    async function fetchStats() {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/stats");

            if (res.status === 403) {
                setError("You don't have permission to view this page.");
                return;
            }

            if (!res.ok) {
                throw new Error("Failed to fetch stats");
            }

            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error("Failed to fetch admin stats:", err);
            setError("Failed to load admin dashboard. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    async function fetchApiCosts() {
        try {
            setApiCostsLoading(true);
            const res = await fetch("/api/admin/api-costs");
            if (res.ok) {
                const data = await res.json();
                setApiCosts(data);
            }
        } catch (err) {
            console.error("Failed to fetch API costs:", err);
        } finally {
            setApiCostsLoading(false);
        }
    }

    async function fetchFeedback() {
        try {
            setFeedbackLoading(true);
            const res = await fetch("/api/admin/feedback");
            if (res.ok) {
                const data = await res.json();
                setFeedbackItems(data.feedback || []);
                setFeedbackCounts(data.counts || { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 });
            }
        } catch (err) {
            console.error("Failed to fetch feedback:", err);
        } finally {
            setFeedbackLoading(false);
        }
    }

    async function saveFeedbackUpdate(feedbackId: string) {
        setSavingFeedback(feedbackId);
        try {
            const body: Record<string, string> = {};
            if (editingStatus[feedbackId] !== undefined) {
                body.status = editingStatus[feedbackId];
            }
            if (editingNotes[feedbackId] !== undefined) {
                body.adminNotes = editingNotes[feedbackId];
            }

            const res = await fetch(`/api/admin/feedback/${feedbackId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (res.ok) {
                const data = await res.json();
                // Update local state
                setFeedbackItems(prev =>
                    prev.map(f => f.id === feedbackId ? { ...f, ...data.feedback } : f)
                );
                // Clear editing state
                setEditingStatus(prev => { const n = { ...prev }; delete n[feedbackId]; return n; });
                setEditingNotes(prev => { const n = { ...prev }; delete n[feedbackId]; return n; });
                // Refresh counts
                fetchFeedback();
            } else {
                const errData = await res.json();
                alert(errData.error || "Failed to update feedback");
            }
        } catch (err) {
            console.error("Failed to save feedback:", err);
            alert("Failed to save feedback update");
        } finally {
            setSavingFeedback(null);
        }
    }

    function getFilteredFeedback(): FeedbackItem[] {
        return feedbackItems.filter(f => {
            if (feedbackStatusFilter !== "all" && f.status !== feedbackStatusFilter) return false;
            if (feedbackTypeFilter !== "all" && f.type !== feedbackTypeFilter) return false;
            if (feedbackPriorityFilter !== "all" && f.priority !== feedbackPriorityFilter) return false;
            return true;
        });
    }

    function getStatusBadgeClass(status: string): string {
        switch (status) {
            case "open": return "bg-blue-100 text-blue-700";
            case "in_progress": return "bg-amber-100 text-amber-700";
            case "resolved": return "bg-green-100 text-green-700";
            case "closed": return "bg-neutral-100 text-neutral-600";
            default: return "bg-neutral-100 text-neutral-600";
        }
    }

    function getPriorityBadgeClass(priority: string): string {
        switch (priority) {
            case "low": return "bg-neutral-100 text-neutral-600";
            case "medium": return "bg-blue-100 text-blue-700";
            case "high": return "bg-orange-100 text-orange-700";
            case "critical": return "bg-red-100 text-red-700";
            default: return "bg-neutral-100 text-neutral-600";
        }
    }

    function getTypeBadgeClass(type: string): string {
        switch (type) {
            case "bug": return "bg-red-100 text-red-700";
            case "feature_request": return "bg-purple-100 text-purple-700";
            default: return "bg-neutral-100 text-neutral-600";
        }
    }

    function formatTokenCount(count: number): string {
        if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
        if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
        return count.toString();
    }

    function formatMonthLabel(monthStr: string): string {
        const [year, month] = monthStr.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    }

    function formatStatusLabel(status: string): string {
        return status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    }

    function formatTypeLabel(type: string): string {
        return type.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    }

    async function toggleUserRole(userId: string, currentRole: string) {
        const newRole = currentRole === "admin" ? "user" : "admin";
        const action = newRole === "admin" ? "promote to admin" : "demote to user";

        if (!confirm(`Are you sure you want to ${action} this user?`)) {
            return;
        }

        setTogglingRole(userId);
        try {
            const res = await fetch(`/api/admin/users/${userId}/role`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.error || "Failed to update role");
                return;
            }

            // Update local state
            setStats(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    users: prev.users.map(u =>
                        u.id === userId ? { ...u, role: newRole } : u
                    ),
                };
            });
        } catch (err) {
            console.error("Failed to toggle role:", err);
            alert("Failed to update user role");
        } finally {
            setTogglingRole(null);
        }
    }

    function handleSort(field: SortField) {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("desc");
        }
    }

    function getSortedUsers(): UserStats[] {
        if (!stats) return [];

        let filtered = stats.users;

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(u =>
                u.name?.toLowerCase().includes(query) ||
                u.email?.toLowerCase().includes(query)
            );
        }

        // Apply sort
        return [...filtered].sort((a, b) => {
            let aVal: number | string = 0;
            let bVal: number | string = 0;

            switch (sortField) {
                case "totalMessages":
                    aVal = a.totalMessages;
                    bVal = b.totalMessages;
                    break;
                case "currentMonthUsage":
                    aVal = a.currentMonthUsage;
                    bVal = b.currentMonthUsage;
                    break;
                case "conversationCount":
                    aVal = a.conversationCount;
                    bVal = b.conversationCount;
                    break;
                case "createdAt":
                    aVal = a.createdAt || "";
                    bVal = b.createdAt || "";
                    break;
                case "name":
                    aVal = a.name?.toLowerCase() || "";
                    bVal = b.name?.toLowerCase() || "";
                    break;
            }

            if (sortDirection === "asc") {
                return aVal > bVal ? 1 : -1;
            }
            return aVal < bVal ? 1 : -1;
        });
    }

    function formatDate(dateStr: string | null): string {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    }

    function getTierBadgeClass(tier: string): string {
        switch (tier) {
            case "pro":
                return "bg-purple-100 text-purple-700";
            case "power":
                return "bg-blue-100 text-blue-700";
            case "team":
                return "bg-amber-100 text-amber-700";
            default:
                return "bg-neutral-100 text-neutral-600";
        }
    }

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return null;
        return sortDirection === "asc"
            ? <ChevronUp className="w-4 h-4" />
            : <ChevronDown className="w-4 h-4" />;
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="max-w-md mx-auto text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-xl font-bold text-neutral-900 mb-2">Access Denied</h1>
                    <p className="text-neutral-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!stats) return null;

    const sortedUsers = getSortedUsers();

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="font-display text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
                    Admin Dashboard
                </h1>
                <p className="text-neutral-600">
                    Overview of CEO Sidekick usage and users
                </p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon={Users}
                    label="Total Users"
                    value={stats.overview.totalUsers}
                    color="blue"
                />
                <StatCard
                    icon={MessageSquare}
                    label="User Messages"
                    value={stats.overview.userMessages}
                    color="green"
                />
                <StatCard
                    icon={MessagesSquare}
                    label="Conversations"
                    value={stats.overview.totalConversations}
                    color="purple"
                />
                <StatCard
                    icon={DollarSign}
                    label="Est. MRR"
                    value={`$${stats.overview.estimatedMRR}`}
                    color="amber"
                />
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon={UserPlus}
                    label="New (7 days)"
                    value={stats.overview.recentSignups}
                    color="teal"
                    small
                />
                <StatCard
                    icon={Activity}
                    label="Active This Month"
                    value={stats.overview.activeUsers}
                    color="indigo"
                    small
                />
                <StatCard
                    icon={TrendingUp}
                    label="Avg Msgs/User"
                    value={stats.overview.avgMessagesPerUser}
                    color="pink"
                    small
                />
                <StatCard
                    icon={Crown}
                    label="Avg Convos/User"
                    value={stats.overview.avgConversationsPerUser}
                    color="orange"
                    small
                />
            </div>

            {/* Tier Distribution */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-8">
                <h2 className="font-semibold text-neutral-900 mb-4">Subscription Tiers</h2>
                <div className="flex flex-wrap gap-4">
                    {stats.tierDistribution.map((tier) => (
                        <div
                            key={tier.tier}
                            className="flex items-center gap-3 px-4 py-2 rounded-lg bg-neutral-50"
                        >
              <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getTierBadgeClass(tier.tier)}`}>
                {tier.tier || "free"}
              </span>
                            <span className="text-lg font-semibold text-neutral-900">
                {tier.count}
              </span>
                            <span className="text-sm text-neutral-500">users</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Monthly API Costs Section */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-100 text-green-600">
                        <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-neutral-900">Monthly API Costs</h2>
                        <p className="text-xs text-neutral-500">Estimated Anthropic API spend based on credit &amp; token usage</p>
                    </div>
                </div>

                {apiCostsLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                    </div>
                ) : !apiCosts || (apiCosts.creditUsage.length === 0 && apiCosts.months.length === 0) ? (
                    <div className="text-center py-8">
                        <Info className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                        <p className="text-neutral-500 text-sm">No API usage data yet</p>
                        <p className="text-neutral-400 text-xs mt-1">Usage will appear here once users start making requests</p>
                    </div>
                ) : (
                    <>
                        {/* Summary Cards from credit-based data */}
                        {apiCosts.creditUsage.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                                    <p className="text-sm text-green-700 mb-1">Current Month Est. Cost</p>
                                    <p className="text-2xl font-bold text-green-900">
                                        ${apiCosts.creditUsage[0]?.estimatedCost.toFixed(2) || "0.00"}
                                    </p>
                                    <p className="text-xs text-green-600 mt-1">
                                        {apiCosts.creditUsage[0]?.totalCreditsUsed.toLocaleString() || 0} credits used
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
                                    <p className="text-sm text-neutral-600 mb-1">Last Month Est. Cost</p>
                                    <p className="text-2xl font-bold text-neutral-900">
                                        ${apiCosts.creditUsage[1]?.estimatedCost.toFixed(2) || "0.00"}
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        {apiCosts.creditUsage[1]?.totalCreditsUsed.toLocaleString() || 0} credits used
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
                                    <p className="text-sm text-neutral-600 mb-1">Est. Tokens (Current)</p>
                                    <p className="text-2xl font-bold text-neutral-900">
                                        {formatTokenCount(apiCosts.creditUsage[0]?.estimatedTokens || 0)}
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-1">
                                        {apiCosts.creditUsage[0]?.activeUsers || 0} active of {apiCosts.creditUsage[0]?.totalUsers || 0} users
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Token-level Model Breakdown (when usageLogs data exists) */}
                        {apiCosts.months.length > 0 && apiCosts.months[0]?.byModel.length > 0 && (
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-neutral-700 mb-3">Model Breakdown (Current Month)</h3>
                                <div className="space-y-2">
                                    {apiCosts.months[0].byModel.map((m) => (
                                        <div key={m.model} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50">
                                            <div className="flex items-center gap-3">
                                                <code className="text-xs bg-white px-2 py-1 rounded border border-neutral-200 text-neutral-700">
                                                    {m.model}
                                                </code>
                                                <span className="text-sm text-neutral-500">
                                                    {m.requests} requests
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs text-neutral-400">
                                                    {formatTokenCount(m.inputTokens)} in / {formatTokenCount(m.outputTokens)} out
                                                </span>
                                                <span className="text-sm font-semibold text-neutral-900">
                                                    ${m.estimatedCost.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Monthly Usage History Table (credit-based, always available) */}
                        {apiCosts.creditUsage.length > 0 && (
                            <div>
                                <h3 className="text-sm font-medium text-neutral-700 mb-3">Monthly Usage History</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-neutral-200">
                                                <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 uppercase">Month</th>
                                                <th className="text-right py-2 px-3 text-xs font-medium text-neutral-500 uppercase">Credits Used</th>
                                                <th className="text-right py-2 px-3 text-xs font-medium text-neutral-500 uppercase">Est. Tokens</th>
                                                <th className="text-right py-2 px-3 text-xs font-medium text-neutral-500 uppercase">Active Users</th>
                                                <th className="text-right py-2 px-3 text-xs font-medium text-neutral-500 uppercase">Est. Cost</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {apiCosts.creditUsage.map((m) => (
                                                <tr key={m.month} className="border-b border-neutral-100 hover:bg-neutral-50">
                                                    <td className="py-2 px-3 font-medium text-neutral-900">{formatMonthLabel(m.month)}</td>
                                                    <td className="py-2 px-3 text-right text-neutral-600">{m.totalCreditsUsed.toLocaleString()}</td>
                                                    <td className="py-2 px-3 text-right text-neutral-600">{formatTokenCount(m.estimatedTokens)}</td>
                                                    <td className="py-2 px-3 text-right text-neutral-600">{m.activeUsers} / {m.totalUsers}</td>
                                                    <td className="py-2 px-3 text-right font-semibold text-neutral-900">${m.estimatedCost.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <p className="text-xs text-neutral-400 mt-3">
                                    * Cost estimates based on blended model pricing (~$0.12/credit). Granular per-model breakdown will appear as detailed token logging accumulates.
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Feedback Management Section */}
            <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-100 text-purple-600">
                        <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-neutral-900">User Feedback</h2>
                        <p className="text-xs text-neutral-500">Bug reports and feature requests from users</p>
                    </div>
                </div>

                {/* Status Count Pills */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-700">
                        {feedbackCounts.total} Total
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {feedbackCounts.open} Open
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        {feedbackCounts.inProgress} In Progress
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        {feedbackCounts.resolved} Resolved
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-neutral-200 text-neutral-600">
                        {feedbackCounts.closed} Closed
                    </span>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-4">
                    <select
                        value={feedbackStatusFilter}
                        onChange={(e) => setFeedbackStatusFilter(e.target.value)}
                        className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary-red"
                    >
                        <option value="all">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                    </select>
                    <select
                        value={feedbackTypeFilter}
                        onChange={(e) => setFeedbackTypeFilter(e.target.value)}
                        className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary-red"
                    >
                        <option value="all">All Types</option>
                        <option value="bug">Bug Report</option>
                        <option value="feature_request">Feature Request</option>
                    </select>
                    <select
                        value={feedbackPriorityFilter}
                        onChange={(e) => setFeedbackPriorityFilter(e.target.value)}
                        className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-primary-red"
                    >
                        <option value="all">All Priorities</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>

                {feedbackLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                    </div>
                ) : feedbackItems.length === 0 ? (
                    <div className="text-center py-8">
                        <MessageSquare className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                        <p className="text-neutral-500 text-sm">No feedback submitted yet</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {getFilteredFeedback().map((item) => {
                            const isExpanded = expandedFeedbackId === item.id;
                            const hasEdits = editingStatus[item.id] !== undefined || editingNotes[item.id] !== undefined;

                            return (
                                <div key={item.id} className="border border-neutral-200 rounded-lg overflow-hidden">
                                    {/* Row header */}
                                    <div
                                        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-neutral-50 transition-colors"
                                        onClick={() => setExpandedFeedbackId(isExpanded ? null : item.id)}
                                    >
                                        <ChevronRight className={`w-4 h-4 text-neutral-400 transition-transform flex-shrink-0 ${isExpanded ? "rotate-90" : ""}`} />

                                        {/* User avatar */}
                                        <div className="flex-shrink-0">
                                            {item.userImage ? (
                                                <img src={item.userImage} alt="" className="w-7 h-7 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center">
                                                    <span className="text-xs font-medium text-neutral-600">
                                                        {(item.userName || item.userEmail || "U").charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Type badge */}
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${getTypeBadgeClass(item.type)}`}>
                                            {item.type === "bug" ? <Bug className="w-3 h-3 inline mr-1" /> : <Lightbulb className="w-3 h-3 inline mr-1" />}
                                            {formatTypeLabel(item.type)}
                                        </span>

                                        {/* Title */}
                                        <span className="text-sm font-medium text-neutral-900 truncate flex-1 min-w-0">
                                            {item.title}
                                        </span>

                                        {/* Status badge */}
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${getStatusBadgeClass(item.status)}`}>
                                            {formatStatusLabel(item.status)}
                                        </span>

                                        {/* Priority badge */}
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${getPriorityBadgeClass(item.priority)}`}>
                                            {item.priority}
                                        </span>

                                        {/* Date */}
                                        <span className="text-xs text-neutral-400 flex-shrink-0 hidden md:block">
                                            {formatDate(item.createdAt)}
                                        </span>
                                    </div>

                                    {/* Expanded details */}
                                    {isExpanded && (
                                        <div className="border-t border-neutral-200 p-4 bg-neutral-50">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <p className="text-xs font-medium text-neutral-500 mb-1">Submitted by</p>
                                                    <p className="text-sm text-neutral-900">{item.userName || "Unknown"} ({item.userEmail})</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-neutral-500 mb-1">Submitted</p>
                                                    <p className="text-sm text-neutral-900">{formatDate(item.createdAt)}</p>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <p className="text-xs font-medium text-neutral-500 mb-1">Description</p>
                                                <p className="text-sm text-neutral-700 whitespace-pre-wrap">{item.description}</p>
                                            </div>

                                            {item.stepsToReproduce && (
                                                <div className="mb-4">
                                                    <p className="text-xs font-medium text-neutral-500 mb-1">Steps to Reproduce</p>
                                                    <p className="text-sm text-neutral-700 whitespace-pre-wrap">{item.stepsToReproduce}</p>
                                                </div>
                                            )}

                                            {item.expectedBehavior && (
                                                <div className="mb-4">
                                                    <p className="text-xs font-medium text-neutral-500 mb-1">Expected Behavior</p>
                                                    <p className="text-sm text-neutral-700 whitespace-pre-wrap">{item.expectedBehavior}</p>
                                                </div>
                                            )}

                                            {item.actualBehavior && (
                                                <div className="mb-4">
                                                    <p className="text-xs font-medium text-neutral-500 mb-1">Actual Behavior</p>
                                                    <p className="text-sm text-neutral-700 whitespace-pre-wrap">{item.actualBehavior}</p>
                                                </div>
                                            )}

                                            {item.useCase && (
                                                <div className="mb-4">
                                                    <p className="text-xs font-medium text-neutral-500 mb-1">Use Case</p>
                                                    <p className="text-sm text-neutral-700 whitespace-pre-wrap">{item.useCase}</p>
                                                </div>
                                            )}

                                            {item.pageUrl && (
                                                <div className="mb-4">
                                                    <p className="text-xs font-medium text-neutral-500 mb-1">Page URL</p>
                                                    <p className="text-sm text-neutral-700 break-all">{item.pageUrl}</p>
                                                </div>
                                            )}

                                            {/* Admin Controls */}
                                            <div className="mt-4 pt-4 border-t border-neutral-200">
                                                <h4 className="text-sm font-semibold text-neutral-800 mb-3">Admin Actions</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-xs font-medium text-neutral-500 block mb-1">Status</label>
                                                        <select
                                                            value={editingStatus[item.id] ?? item.status}
                                                            onChange={(e) => setEditingStatus(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-red"
                                                        >
                                                            <option value="open">Open</option>
                                                            <option value="in_progress">In Progress</option>
                                                            <option value="resolved">Resolved</option>
                                                            <option value="closed">Closed</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-neutral-500 block mb-1">Admin Notes</label>
                                                        <textarea
                                                            value={editingNotes[item.id] ?? item.adminNotes ?? ""}
                                                            onChange={(e) => setEditingNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                            placeholder="Add notes..."
                                                            rows={2}
                                                            className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary-red resize-none"
                                                        />
                                                    </div>
                                                </div>
                                                {hasEdits && (
                                                    <div className="mt-3 flex justify-end">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                saveFeedbackUpdate(item.id);
                                                            }}
                                                            disabled={savingFeedback === item.id}
                                                            className="flex items-center gap-2 px-4 py-2 bg-primary-red text-white text-sm font-medium rounded-lg hover:bg-primary-red/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            {savingFeedback === item.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Save className="w-4 h-4" />
                                                            )}
                                                            Save Changes
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {getFilteredFeedback().length === 0 && (
                            <div className="text-center py-6 text-neutral-500 text-sm">
                                No feedback matches the selected filters.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Users Section */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                <div className="p-4 border-b border-neutral-200">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <h2 className="font-semibold text-neutral-900">
                            Users ({stats.users.length})
                        </h2>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 pr-4 py-2 rounded-lg border border-neutral-200 text-sm w-full md:w-64 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red"
                            />
                        </div>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-neutral-100">
                    {sortedUsers.map((user) => (
                        <div key={user.id} className="p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0">
                                    {user.image && user.image.length > 0 ? (
                                        <img
                                            src={user.image}
                                            alt=""
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
                      <span className="text-sm font-medium text-neutral-600">
                        {(user.name || user.email || "U").charAt(0).toUpperCase()}
                      </span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-neutral-900 truncate">
                                        {user.name || "No name"}
                                    </p>
                                    <p className="text-xs text-neutral-500 truncate">
                                        {user.email}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                        <button
                                            onClick={() => toggleUserRole(user.id, user.role)}
                                            disabled={togglingRole === user.id}
                                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                                                user.role === "admin"
                                                    ? "bg-amber-100 text-amber-700"
                                                    : "bg-neutral-100 text-neutral-600"
                                            }`}
                                        >
                                            {user.role === "admin" ? (
                                                <Shield className="w-3 h-3" />
                                            ) : (
                                                <ShieldOff className="w-3 h-3" />
                                            )}
                                            {user.role}
                                        </button>
                                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getTierBadgeClass(user.tier)}`}>
                      {user.tier}
                    </span>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                                        <span>{user.totalMessages.toLocaleString()} msgs</span>
                                        <span>{user.currentMonthUsage}/{user.currentMonthLimit + user.bonusCredits} this mo</span>
                                        <span>{formatDate(user.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {sortedUsers.length === 0 && (
                        <div className="p-8 text-center text-neutral-500">
                            No users found matching your search.
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full table-fixed">
                        <thead className="bg-neutral-50 border-b border-neutral-200">
                        <tr>
                            <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider w-[200px]">
                                User
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider w-[80px]">
                                Role
                            </th>
                            <th className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider w-[80px]">
                                Tier
                            </th>
                            <th
                                className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700 w-[100px]"
                                onClick={() => handleSort("totalMessages")}
                            >
                                <div className="flex items-center gap-1">
                                    Total Msgs
                                    <SortIcon field="totalMessages" />
                                </div>
                            </th>
                            <th
                                className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700 w-[120px]"
                                onClick={() => handleSort("currentMonthUsage")}
                            >
                                <div className="flex items-center gap-1">
                                    This Month
                                    <SortIcon field="currentMonthUsage" />
                                </div>
                            </th>
                            <th
                                className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700 w-[80px]"
                                onClick={() => handleSort("conversationCount")}
                            >
                                <div className="flex items-center gap-1">
                                    Convos
                                    <SortIcon field="conversationCount" />
                                </div>
                            </th>
                            <th
                                className="text-left px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider cursor-pointer hover:text-neutral-700 w-[100px]"
                                onClick={() => handleSort("createdAt")}
                            >
                                <div className="flex items-center gap-1">
                                    Joined
                                    <SortIcon field="createdAt" />
                                </div>
                            </th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                        {sortedUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-neutral-50">
                                <td className="px-4 py-3 max-w-[200px]">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="flex-shrink-0">
                                            {user.image && user.image.length > 0 ? (
                                                <img
                                                    src={user.image}
                                                    alt=""
                                                    className="w-8 h-8 rounded-full object-cover"
                                                    onError={(e) => {
                                                        // Hide broken images
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-neutral-200 flex items-center justify-center">
                            <span className="text-xs font-medium text-neutral-600">
                              {(user.name || user.email || "U").charAt(0).toUpperCase()}
                            </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1 overflow-hidden">
                                            <p className="text-sm font-medium text-neutral-900 truncate max-w-[150px]">
                                                {user.name || "No name"}
                                            </p>
                                            <p className="text-xs text-neutral-500 truncate max-w-[150px]">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <button
                                        onClick={() => toggleUserRole(user.id, user.role)}
                                        disabled={togglingRole === user.id}
                                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                            user.role === "admin"
                                                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                        title={user.role === "admin" ? "Click to demote to user" : "Click to promote to admin"}
                                    >
                                        {togglingRole === user.id ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : user.role === "admin" ? (
                                            <Shield className="w-3 h-3" />
                                        ) : (
                                            <ShieldOff className="w-3 h-3" />
                                        )}
                                        {user.role}
                                    </button>
                                </td>
                                <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getTierBadgeClass(user.tier)}`}>
                      {user.tier}
                    </span>
                                </td>
                                <td className="px-4 py-3">
                    <span className="text-sm font-medium text-neutral-900">
                      {user.totalMessages.toLocaleString()}
                    </span>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                      <span className="text-sm text-neutral-900">
                        {user.currentMonthUsage}
                      </span>
                                        <span className="text-xs text-neutral-400">
                        / {user.currentMonthLimit + user.bonusCredits}
                      </span>
                                    </div>
                                    <div className="w-20 h-1.5 bg-neutral-100 rounded-full mt-1">
                                        <div
                                            className="h-full bg-primary-red rounded-full"
                                            style={{
                                                width: `${Math.min(100, (user.currentMonthUsage / (user.currentMonthLimit + user.bonusCredits)) * 100)}%`
                                            }}
                                        />
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-neutral-600">
                                    {user.conversationCount}
                                </td>
                                <td className="px-4 py-3 text-sm text-neutral-500">
                                    {formatDate(user.createdAt)}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    {sortedUsers.length === 0 && (
                        <div className="p-8 text-center text-neutral-500">
                            No users found matching your search.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}