// src/components/sidebar-nav.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    MessageSquare,
    BookOpen,
    Settings,
    Star,
    CreditCard,
    Shield,
    Eye,
    FileText,
} from "lucide-react";

const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: MessageSquare, label: "Chat", href: "/chat" },
    { icon: FileText, label: "Documents", href: "/documents" },
    { icon: BookOpen, label: "Knowledge Base", href: "/knowledge-base" },
    { icon: CreditCard, label: "Pricing", href: "/pricing" },
    { icon: Settings, label: "Settings", href: "/settings" },
];

interface SidebarNavProps {
    isAdmin: boolean;
}

export function SidebarNav({ isAdmin }: SidebarNavProps) {
    const pathname = usePathname();
    const [isAdminView, setIsAdminView] = useState(true);

    // Load saved preference on mount
    useEffect(() => {
        if (isAdmin) {
            const saved = localStorage.getItem("adminViewMode");
            setIsAdminView(saved !== "user");
        }
    }, [isAdmin]);

    function toggleView() {
        const newMode = !isAdminView;
        setIsAdminView(newMode);
        localStorage.setItem("adminViewMode", newMode ? "admin" : "user");
    }

    // Show admin features only if user is admin AND in admin view mode
    const showAdminFeatures = isAdmin && isAdminView;

    return (
        <nav className="flex-1 p-4 flex flex-col">
            <ul className="space-y-1 flex-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

                    return (
                        <li key={item.href}>
                            <Link
                                href={item.href}
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