// src/components/sidebar-nav.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    MessageSquare,
    Settings,
    Star,
    CreditCard,
    Shield,
    Eye,
    FileText,
    AlertCircle,
    FolderOpen,
    Sparkles,
    MessagesSquare,
    Crown,
} from "lucide-react";

// Fields that should be populated for a complete profile
const REQUIRED_SETTINGS_FIELDS = [
    "companyName",
    "industry",
    "productsServices",
    "targetMarket",
    "userRole",
];

interface NavItem {
    icon: React.ElementType;
    label: string;
    href: string;
    badge?: string;
    paidOnly?: boolean;
}

const navItems: NavItem[] = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: MessageSquare, label: "Chat", href: "/chat" },
    { icon: MessagesSquare, label: "Round Table", href: "/roundtable", paidOnly: true },
    { icon: FileText, label: "Templates", href: "/documents" },
    { icon: FolderOpen, label: "Company Library", href: "/knowledge-base" },
    { icon: Sparkles, label: "Content Engine", href: "/content-engine" },
    { icon: CreditCard, label: "Pricing", href: "/pricing" },
];

interface SidebarNavProps {
    isAdmin: boolean;
    userTier?: string; // "free" | "power" | "pro" | "team"
}

export function SidebarNav({ isAdmin, userTier = "free" }: SidebarNavProps) {
    const pathname = usePathname();
    const [isAdminView, setIsAdminView] = useState(true);
    const [settingsIncomplete, setSettingsIncomplete] = useState(false);
    const [isCheckingSettings, setIsCheckingSettings] = useState(true);

    const isPaidUser = userTier === "power" || userTier === "pro" || userTier === "team";

    // Load saved preference on mount
    useEffect(() => {
        if (isAdmin) {
            const saved = localStorage.getItem("adminViewMode");
            setIsAdminView(saved !== "user");
        }
    }, [isAdmin]);

    // Check settings completion on mount and listen for updates
    useEffect(() => {
        checkSettingsCompletion();

        const handleSettingsUpdate = () => {
            checkSettingsCompletion();
        };

        window.addEventListener("settings-updated", handleSettingsUpdate);
        return () => {
            window.removeEventListener("settings-updated", handleSettingsUpdate);
        };
    }, []);

    async function checkSettingsCompletion() {
        try {
            const res = await fetch("/api/settings");
            if (res.ok) {
                const data = await res.json();
                const settings = data.settings || {};

                const missingFields = REQUIRED_SETTINGS_FIELDS.filter(
                    (field) => !settings[field] || settings[field].trim() === ""
                );

                setSettingsIncomplete(missingFields.length > 0);
            }
        } catch (err) {
            console.error("Failed to check settings:", err);
        } finally {
            setIsCheckingSettings(false);
        }
    }

    function toggleView() {
        const newMode = !isAdminView;
        setIsAdminView(newMode);
        localStorage.setItem("adminViewMode", newMode ? "admin" : "user");
    }

    const showAdminFeatures = isAdmin && isAdminView;
    const isSettingsActive = pathname === "/settings";

    return (
        <nav className="flex-1 p-4 flex flex-col">
            <ul className="space-y-1 flex-1">
                {navItems.map((item) => {
                    const isActive =
                        pathname === item.href || pathname.startsWith(item.href + "/");

                    // Round Table: show for all users but style differently for free tier
                    const isLockedPremium = item.paidOnly && !isPaidUser;
                    const isRoundTable = item.href === "/roundtable";

                    return (
                        <li key={item.href}>
                            {isLockedPremium ? (
                                // Premium feature — show but link to pricing
                                <Link
                                    href="/pricing"
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors group relative
                                        ${isRoundTable
                                        ? "bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 text-amber-700 hover:from-amber-100 hover:to-orange-100"
                                        : "text-neutral-400 hover:bg-neutral-50"
                                    }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="flex-1">{item.label}</span>
                                    <Crown className="w-4 h-4 text-amber-500" />
                                </Link>
                            ) : (
                                // Normal or unlocked premium nav item
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                                        isActive
                                            ? isRoundTable
                                                ? "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 font-medium border border-amber-300"
                                                : "bg-primary-red/10 text-primary-red font-medium"
                                            : isRoundTable
                                                ? "bg-gradient-to-r from-amber-50/50 to-orange-50/50 text-amber-700 hover:from-amber-50 hover:to-orange-50 border border-amber-100"
                                                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                                    }`}
                                >
                                    <item.icon className="w-5 h-5" />
                                    <span className="flex-1">{item.label}</span>
                                    {isRoundTable && (
                                        <span className="text-[10px] font-semibold bg-amber-500 text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                                            New
                                        </span>
                                    )}
                                </Link>
                            )}
                        </li>
                    );
                })}

                {/* Settings - with completion indicator */}
                <li>
                    <Link
                        href="/settings"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${
                            isSettingsActive
                                ? "bg-primary-red/10 text-primary-red font-medium"
                                : settingsIncomplete && !isCheckingSettings
                                    ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                        }`}
                    >
                        <div className="relative">
                            <Settings className="w-5 h-5" />
                            {settingsIncomplete && !isCheckingSettings && !isSettingsActive && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                            )}
                        </div>
                        <span className="flex-1">Settings</span>
                        {settingsIncomplete && !isCheckingSettings && !isSettingsActive && (
                            <span className="text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                                !
                            </span>
                        )}
                    </Link>
                </li>

                {/* Feedback - Bold Red */}
                <li>
                    <Link
                        href="/feedback"
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-primary-red font-bold hover:bg-red-50 transition-colors ${
                            pathname === "/feedback" ? "bg-red-50" : ""
                        }`}
                    >
                        <Star className="w-5 h-5" />
                        Feedback
                    </Link>
                </li>

                {/* Admin Link - Only shown when in admin view mode */}
                {showAdminFeatures && (
                    <li className="pt-4 mt-4 border-t border-neutral-200">
                        <Link
                            href="/admin"
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                                pathname === "/admin"
                                    ? "bg-primary-red/10 text-primary-red font-medium"
                                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                            }`}
                        >
                            <Shield className="w-5 h-5" />
                            Admin
                        </Link>
                    </li>
                )}
            </ul>

            {/* Settings Completion Reminder */}
            {settingsIncomplete && !isCheckingSettings && pathname !== "/settings" && (
                <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-semibold text-amber-800">
                                Complete Your Profile
                            </p>
                            <p className="text-xs text-amber-600 mt-0.5">
                                Add company info for personalized documents & AI advice.
                            </p>
                            <Link
                                href="/settings"
                                className="inline-block mt-2 text-xs font-semibold text-amber-700 hover:text-amber-800 underline underline-offset-2"
                            >
                                Complete Setup →
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Admin View Toggle - Always visible to admins */}
            {isAdmin && (
                <div className="pt-4 mt-4 border-t border-neutral-200">
                    <button
                        onClick={toggleView}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                            isAdminView
                                ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                        }`}
                    >
                        {isAdminView ? (
                            <>
                                <Shield className="w-5 h-5" />
                                Admin View
                            </>
                        ) : (
                            <>
                                <Eye className="w-5 h-5" />
                                User View
                            </>
                        )}
                    </button>
                    <p className="text-xs text-neutral-400 mt-2 px-4">
                        {isAdminView ? "Viewing as admin" : "Viewing as regular user"}
                    </p>
                </div>
            )}
        </nav>
    );
}