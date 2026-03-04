"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                const data = await response.json();
                setError(data.error || "An error occurred. Please try again.");
                setIsLoading(false);
                return;
            }

            setIsSubmitted(true);
        } catch {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

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
                    Reset your password
                </h1>
                <p className="text-neutral-600">
                    {isSubmitted
                        ? "Check your email for a reset link"
                        : "Enter your email and we\u2019ll send you a reset link"}
                </p>
            </div>

            {isSubmitted ? (
                /* Success State */
                <div>
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">
                            If an account exists with that email, you will receive a password reset link shortly.
                        </span>
                    </div>
                    <Link href="/login">
                        <Button variant="outline" className="w-full" size="lg">
                            <ArrowLeft className="w-5 h-5" />
                            Back to Sign In
                        </Button>
                    </Link>
                </div>
            ) : (
                /* Form State */
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
                                Email address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                required
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
                                    Sending reset link...
                                </>
                            ) : (
                                "Send Reset Link"
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-neutral-600 mt-6">
                        Remember your password?{" "}
                        <Link
                            href="/login"
                            className="text-primary-red font-semibold hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            )}
        </div>
    );
}
