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

interface MobileNavProps {
    userName: string;
    userEmail: string;
    userImage?: string | null;
    isAdmin?: boolean;
}

export function MobileNav({ userName, userEmail, userImage, isAdmin = false }: MobileNavProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAdminView, setIsAdminView] = useState(true);
    const pathname = usePathname();

    // Load saved preference on mount
    useEffect(() => {
        if (isAdmin) {
            const saved = localStorage.getItem("adminViewMode");
            setIsAdminView(saved !== "user");
        }
    }, [isAdmin]);

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

    function toggleView() {
        const newMode = !isAdminView;
        setIsAdminView(newMode);
        localStorage.setItem("adminViewMode", newMode ? "admin" : "user");
    }

    // Show admin features only if user is admin AND in admin view mode
    const showAdminFeatures = isAdmin && isAdminView;

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
                            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
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
                    className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Slide-out Sidebar */}
            <aside
                className={`md:hidden fixed top-0 left-0 z-50 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                {/* Logo */}
                <div className="p-6 border-b border-neutral-200">
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