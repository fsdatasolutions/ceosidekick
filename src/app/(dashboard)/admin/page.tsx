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
    Search,
    Shield,
    ShieldOff,
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
    bonusMessages: number;
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

    useEffect(() => {
        fetchStats();
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
                                        <span>{user.currentMonthUsage}/{user.currentMonthLimit + user.bonusMessages} this mo</span>
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
                        / {user.currentMonthLimit + user.bonusMessages}
                      </span>
                                    </div>
                                    <div className="w-20 h-1.5 bg-neutral-100 rounded-full mt-1">
                                        <div
                                            className="h-full bg-primary-red rounded-full"
                                            style={{
                                                width: `${Math.min(100, (user.currentMonthUsage / (user.currentMonthLimit + user.bonusMessages)) * 100)}%`
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