"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    AlertCircle,
    Loader2,
    CheckCircle2,
    Eye,
    EyeOff,
    ArrowLeft,
} from "lucide-react";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    // If no token in URL, show error state
    if (!token) {
        return (
            <div>
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">
                        Invalid reset link. Please request a new password reset.
                    </span>
                </div>
                <Link href="/forgot-password">
                    <Button variant="outline" className="w-full" size="lg">
                        Request New Reset Link
                    </Button>
                </Link>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "An error occurred. Please try again.");
                setIsLoading(false);
                return;
            }

            setIsSuccess(true);
        } catch {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div>
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">
                        Your password has been reset successfully.
                    </span>
                </div>
                <Link href="/login">
                    <Button className="w-full" size="lg">
                        Sign In with New Password
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div>
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        New password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Create a new password"
                            required
                            minLength={8}
                            disabled={isLoading}
                            className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red pr-12 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? (
                                <EyeOff className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1.5">
                        Must be at least 8 characters
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                        Confirm new password
                    </label>
                    <input
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        required
                        minLength={8}
                        disabled={isLoading}
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Resetting password...
                        </>
                    ) : (
                        "Reset Password"
                    )}
                </Button>
            </form>

            <p className="text-center text-sm text-neutral-600 mt-6">
                <Link
                    href="/login"
                    className="text-primary-red font-semibold hover:underline inline-flex items-center gap-1"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sign In
                </Link>
            </p>
        </div>
    );
}

function ResetPasswordSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-12 bg-neutral-200 rounded-xl" />
            <div className="h-12 bg-neutral-200 rounded-xl" />
            <div className="h-12 bg-neutral-200 rounded-xl" />
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div>
            {/* Mobile Logo */}
            <div className="lg:hidden flex justify-center mb-8">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-primary-red/20">
                        <img
                            src="/images/robin-logo.png"
                            alt="CEO Sidekick logo"
                            className="w-6 h-6 object-contain"
                        />
                    </div>
                    <span className="font-display font-bold text-xl text-neutral-900">
                        CEO Sidekick
                    </span>
                </Link>
            </div>

            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
                    Set new password
                </h1>
                <p className="text-neutral-600">
                    Enter your new password below
                </p>
            </div>

            <Suspense fallback={<ResetPasswordSkeleton />}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
