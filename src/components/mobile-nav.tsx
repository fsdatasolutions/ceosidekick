// src/components/mobile-nav.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Menu,
    X,
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
}

const navItems: NavItem[] = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: MessageSquare, label: "Chat", href: "/chat" },
    { icon: FileText, label: "Templates", href: "/documents" },
    { icon: FolderOpen, label: "Company Library", href: "/knowledge-base" },
    { icon: CreditCard, label: "Pricing", href: "/pricing" },
];

interface MobileNavProps {
    userName: string;
    userEmail: string;
    userImage?: string | null;
    isAdmin?: boolean;
}

export function MobileNav({ userName, userEmail, userImage, isAdmin = false }: MobileNavProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAdminView, setIsAdminView] = useState(true);
    const [settingsIncomplete, setSettingsIncomplete] = useState(false);
    const [isCheckingSettings, setIsCheckingSettings] = useState(true);
    const pathname = usePathname();

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

        // Listen for settings updates from the settings page
        const handleSettingsUpdate = () => {
            checkSettingsCompletion();
        };

        window.addEventListener("settings-updated", handleSettingsUpdate);
        return () => {
            window.removeEventListener("settings-updated", handleSettingsUpdate);
        };
    }, []);

    // Close menu when route changes
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Prevent body scroll when menu is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    async function checkSettingsCompletion() {
        try {
            const res = await fetch("/api/settings");
            if (res.ok) {
                const data = await res.json();
                const settings = data.settings || {};

                // Check if required fields are populated
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

    // Show admin features only if user is admin AND in admin view mode
    const showAdminFeatures = isAdmin && isAdminView;
    const isSettingsActive = pathname === "/settings";

    return (
        <>
            {/* Mobile Header Bar */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-neutral-200 px-4 py-3">
                <div className="flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-md shadow-primary-red/20">
                            <img
                                src="/images/robin-logo.png"
                                alt="CEO SideKick"
                                className="w-5 h-5 object-contain"
                            />
                        </div>
                        <span className="font-display font-bold text-neutral-900">
                            CEO Sidekick
                        </span>
                    </Link>

                    <div className="flex items-center gap-2">
                        {/* Settings incomplete indicator in header */}
                        {settingsIncomplete && !isCheckingSettings && (
                            <Link
                                href="/settings"
                                className="p-1.5 rounded-lg bg-amber-100 text-amber-600"
                                title="Complete your profile"
                            >
                                <AlertCircle className="w-4 h-4" />
                            </Link>
                        )}

                        {/* Admin view indicator */}
                        {isAdmin && (
                            <span className={`p-1.5 rounded ${
                                isAdminView
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-neutral-100 text-neutral-600"
                            }`}>
                                {isAdminView ? <Shield className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </span>
                        )}

                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                            aria-label={isOpen ? "Close menu" : "Open menu"}
                        >
                            {isOpen ? (
                                <X className="w-6 h-6 text-neutral-700" />
                            ) : (
                                <Menu className="w-6 h-6 text-neutral-700" />
                            )}
                        </button>
                    </div>
                </div>
            </header>

            {/* Backdrop */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/20 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Slide-out Menu */}
            <aside
                className={`md:hidden fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white z-50 transform transition-transform duration-300 ease-out flex flex-col ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                {/* Menu Header */}
                <div className="p-4 border-b border-neutral-200">
                    <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-primary-red/20">
                            <img
                                src="/images/robin-logo.png"
                                alt="CEO SideKick"
                                className="w-6 h-6 object-contain"
                            />
                        </div>
                        <span className="font-display font-bold text-lg text-neutral-900">
                            CEO Sidekick
                        </span>
                    </Link>
                </div>

                {/* Settings Completion Banner - At top of nav */}
                {settingsIncomplete && !isCheckingSettings && (
                    <div className="mx-4 mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-amber-800">
                                    Complete Your Profile
                                </p>
                                <p className="text-xs text-amber-600 mt-0.5">
                                    Add company info for personalized documents.
                                </p>
                                <Link
                                    href="/settings"
                                    onClick={() => setIsOpen(false)}
                                    className="inline-flex items-center justify-center w-full mt-2 px-3 py-2 bg-amber-500 text-white text-xs font-medium rounded-lg hover:bg-amber-600 transition-colors"
                                >
                                    Complete Setup
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 p-4 overflow-y-auto">
                    <ul className="space-y-1">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                                            isActive
                                                ? "bg-primary-red/10 text-primary-red font-medium"
                                                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                                        }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}

                        {/* Settings - with completion indicator */}
                        <li>
                            <Link
                                href="/settings"
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                                    isSettingsActive
                                        ? "bg-primary-red/10 text-primary-red font-medium"
                                        : settingsIncomplete && !isCheckingSettings
                                            ? "bg-amber-50 text-amber-700 border border-amber-200"
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
                                    <span className="text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full font-medium">
                                        Incomplete
                                    </span>
                                )}
                            </Link>
                        </li>

                        {/* Feedback */}
                        <li>
                            <Link
                                href="/feedback"
                                onClick={() => setIsOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-primary-red font-bold hover:bg-red-50 transition-colors"
                            >
                                <Star className="w-5 h-5" />
                                Feedback
                            </Link>
                        </li>

                        {/* Admin - Only shown when in admin view mode */}
                        {showAdminFeatures && (
                            <li className="pt-4 mt-4 border-t border-neutral-200">
                                <Link
                                    href="/admin"
                                    onClick={() => setIsOpen(false)}
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
                </nav>

                {/* Admin View Toggle */}
                {isAdmin && (
                    <div className="px-4 py-3 border-t border-neutral-200">
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
                        <p className="text-xs text-neutral-400 mt-1 text-center">
                            {isAdminView ? "Viewing as admin" : "Viewing as regular user"}
                        </p>
                    </div>
                )}

                {/* User Section */}
                <div className="p-4 border-t border-neutral-200">
                    <div className="flex items-center gap-3">
                        {userImage ? (
                            <img
                                src={userImage}
                                alt={userName}
                                className="w-10 h-10 rounded-full"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center">
                                <span className="text-neutral-600 font-medium">
                                    {userName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">
                                {userName}
                            </p>
                            <p className="text-xs text-neutral-500 truncate">{userEmail}</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}