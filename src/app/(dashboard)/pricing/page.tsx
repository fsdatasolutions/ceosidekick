// src/app/(dashboard)/pricing/page.tsx
// In-app pricing page for upgrades

"use client";

import { useState, useEffect } from "react";
import { Check, Zap, TrendingUp, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TIERS, MESSAGE_PACKS, TierType } from "@/lib/tiers";
import { useUsage } from "@/components/ui/usage-meter";

export default function PricingPage() {
    const { usage, loading: usageLoading } = useUsage();
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

    // Safely get current tier - fallback to "free" if not found
    const rawTier = usage?.tier || "free";
    const currentTier = (rawTier in TIERS ? rawTier : "free") as TierType;
    const currentTierConfig = TIERS[currentTier];

    // Debug: log if tier doesn't match (in useEffect to avoid render side effects)
    useEffect(() => {
        if (rawTier && !(rawTier in TIERS)) {
            console.warn(`[Pricing] Unknown tier "${rawTier}" from database. Valid tiers: ${Object.keys(TIERS).join(", ")}`);
        }
    }, [rawTier]);

    async function handleUpgrade(tierId: string) {
        setCheckoutLoading(tierId);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tierId }),
            });

            const data = await res.json();

            if (data.url) {
                window.location.assign(data.url);
            } else {
                console.error("Checkout failed:", data.error);
                alert("Failed to start checkout. Please try again.");
                setCheckoutLoading(null);
            }
        } catch (error) {
            console.error("Checkout error:", error);
            alert("An error occurred. Please try again.");
            setCheckoutLoading(null);
        }
    }

    async function handleBuyPack(packId: string) {
        setCheckoutLoading(packId);
        try {
            const res = await fetch("/api/stripe/checkout-pack", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packId }),
            });

            const data = await res.json();

            if (data.url) {
                window.location.assign(data.url);
            } else {
                console.error("Pack checkout failed:", data.error);
                alert("Failed to start checkout. Please try again.");
                setCheckoutLoading(null);
            }
        } catch (error) {
            console.error("Pack checkout error:", error);
            alert("An error occurred. Please try again.");
            setCheckoutLoading(null);
        }
    }

    async function handleManageBilling() {
        setCheckoutLoading("portal");
        try {
            const res = await fetch("/api/stripe/portal", {
                method: "POST",
            });

            const data = await res.json();

            if (data.url) {
                window.location.assign(data.url);
            } else {
                console.error("Portal failed:", data.error);
                setCheckoutLoading(null);
            }
        } catch (error) {
            console.error("Portal error:", error);
            setCheckoutLoading(null);
        }
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Dashboard
                </Link>
                <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
                    Choose Your Plan
                </h1>
                <p className="text-neutral-600">
                    {currentTier === "free"
                        ? "Upgrade to unlock more messages and features."
                        : `You're currently on the ${currentTierConfig.name} plan.`
                    }
                </p>
            </div>

            {/* Current Usage */}
            {usage && (
                <div className="mb-8 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-neutral-500">Current Usage</p>
                            <p className="text-lg font-semibold text-neutral-900">
                                {usage.messagesUsed} / {usage.totalAvailable} messages
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-neutral-500">Current Plan</p>
                            <p className="text-lg font-semibold text-neutral-900">{usage.tierName}</p>
                        </div>
                        {currentTier !== "free" && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleManageBilling}
                                disabled={checkoutLoading === "portal"}
                            >
                                {checkoutLoading === "portal" ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    "Manage Billing"
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {/* Subscription Plans */}
            <div className="mb-12">
                <h2 className="text-xl font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary-red" />
                    Subscription Plans
                </h2>
                <div className="grid md:grid-cols-3 gap-6">
                    {Object.values(TIERS)
                        .filter((tier) => !tier.isComingSoon)
                        .map((tier) => {
                            const isCurrentTier = tier.id === currentTier;
                            const isDowngrade =
                                tier.id === "free" && currentTier !== "free";

                            return (
                                <div
                                    key={tier.id}
                                    className={`rounded-2xl border-2 p-6 ${
                                        tier.isPopular
                                            ? "border-primary-red bg-primary-red/5"
                                            : isCurrentTier
                                                ? "border-green-500 bg-green-50"
                                                : "border-neutral-200"
                                    }`}
                                >
                                    {tier.isPopular && (
                                        <span className="inline-block px-3 py-1 text-xs font-semibold bg-primary-red text-white rounded-full mb-4">
                      Most Popular
                    </span>
                                    )}
                                    {isCurrentTier && (
                                        <span className="inline-block px-3 py-1 text-xs font-semibold bg-green-500 text-white rounded-full mb-4">
                      Current Plan
                    </span>
                                    )}

                                    <h3 className="text-xl font-bold text-neutral-900">{tier.name}</h3>
                                    <div className="mt-2 mb-4">
                    <span className="text-4xl font-bold text-neutral-900">
                      {tier.priceDisplay}
                    </span>
                                        {tier.price > 0 && (
                                            <span className="text-neutral-500">/month</span>
                                        )}
                                    </div>

                                    <ul className="space-y-3 mb-6">
                                        {tier.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-sm text-neutral-600">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {isCurrentTier ? (
                                        <Button className="w-full" variant="outline" disabled>
                                            Current Plan
                                        </Button>
                                    ) : isDowngrade ? (
                                        <Button
                                            className="w-full"
                                            variant="outline"
                                            onClick={handleManageBilling}
                                        >
                                            Manage in Billing
                                        </Button>
                                    ) : tier.id === "free" ? (
                                        <Button className="w-full" variant="outline" disabled>
                                            Free Forever
                                        </Button>
                                    ) : (
                                        <Button
                                            className="w-full"
                                            onClick={() => handleUpgrade(tier.id)}
                                            disabled={checkoutLoading !== null}
                                        >
                                            {checkoutLoading === tier.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                `Upgrade to ${tier.name}`
                                            )}
                                        </Button>
                                    )}
                                </div>
                            );
                        })}

                    {/* Team Tier - Coming Soon */}
                    <div className="rounded-2xl border-2 border-dashed border-neutral-300 p-6 bg-neutral-50">
            <span className="inline-block px-3 py-1 text-xs font-semibold bg-neutral-200 text-neutral-600 rounded-full mb-4">
              Coming Soon
            </span>
                        <h3 className="text-xl font-bold text-neutral-900">{TIERS.team.name}</h3>
                        <div className="mt-2 mb-4">
              <span className="text-4xl font-bold text-neutral-400">
                {TIERS.team.priceDisplay}
              </span>
                            <span className="text-neutral-400">/month</span>
                        </div>
                        <ul className="space-y-3 mb-6">
                            {TIERS.team.features.slice(0, 4).map((feature, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <Check className="w-5 h-5 text-neutral-400 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm text-neutral-400">{feature}</span>
                                </li>
                            ))}
                        </ul>
                        <Button className="w-full" variant="outline" disabled>
                            Coming Soon
                        </Button>
                    </div>
                </div>
            </div>

            {/* Message Packs */}
            <div id="packs">
                <h2 className="text-xl font-semibold text-neutral-900 mb-2 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Message Packs
                </h2>
                <p className="text-neutral-600 mb-4">
                    Need more messages? Buy a pack to instantly add messages to your current month.
                </p>
                <div className="grid md:grid-cols-3 gap-6">
                    {MESSAGE_PACKS.map((pack) => (
                        <div
                            key={pack.id}
                            className="rounded-xl border border-neutral-200 p-6 bg-white"
                        >
                            <h3 className="text-lg font-semibold text-neutral-900">{pack.name}</h3>
                            <div className="mt-2 mb-1">
                <span className="text-3xl font-bold text-neutral-900">
                  {pack.priceDisplay}
                </span>
                            </div>
                            <p className="text-sm text-neutral-500 mb-4">
                                {pack.messages.toLocaleString()} messages • {pack.perMessageCost} each
                            </p>
                            <Button
                                className="w-full"
                                variant="outline"
                                onClick={() => handleBuyPack(pack.id)}
                                disabled={checkoutLoading !== null}
                            >
                                {checkoutLoading === pack.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4" />
                                        Buy Pack
                                    </>
                                )}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* FAQ or Help */}
            <div className="mt-12 text-center">
                <p className="text-neutral-500 text-sm">
                    Questions about billing?{" "}
                    <Link href="/support" className="text-primary-red hover:underline">
                        Contact support
                    </Link>
                </p>
            </div>
        </div>
    );
}