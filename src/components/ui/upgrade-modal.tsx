// src/components/ui/upgrade-modal.tsx
"use client";

import { useState } from "react";
import { X, Zap, Check, Sparkles, Loader2 } from "lucide-react";
import { Button } from "./button";
import { TIERS, MESSAGE_PACKS, getAvailableTiers } from "@/lib/tiers";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: string;
  messagesUsed: number;
  messagesLimit: number;
}

export function UpgradeModal({
                               isOpen,
                               onClose,
                               currentTier,
                               messagesUsed,
                               messagesLimit
                             }: UpgradeModalProps) {
  const [activeTab, setActiveTab] = useState<"upgrade" | "packs">("upgrade");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const availableTiers = getAvailableTiers().filter(t => t.id !== "free" && t.id !== currentTier);

  const handleUpgrade = async (tierId: string) => {
    setLoading(tierId);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId }),
      });

      const data = await res.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to start checkout");
        setLoading(null);
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError("An error occurred. Please try again.");
      setLoading(null);
    }
  };

  const handleBuyPack = async (packId: string) => {
    setLoading(packId);
    setError(null);

    try {
      const res = await fetch("/api/stripe/checkout-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });

      const data = await res.json();

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to start checkout");
        setLoading(null);
      }
    } catch (err) {
      console.error("Pack checkout error:", err);
      setError("An error occurred. Please try again.");
      setLoading(null);
    }
  };

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <div>
              <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary-red" />
                Need More Messages?
              </h2>
              <p className="text-sm text-neutral-500 mt-1">
                You&apos;ve used {messagesUsed.toLocaleString()} of {messagesLimit.toLocaleString()} messages this month
              </p>
            </div>
            <button
                onClick={onClose}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-neutral-200">
            <button
                onClick={() => setActiveTab("upgrade")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    activeTab === "upgrade"
                        ? "text-primary-red border-b-2 border-primary-red"
                        : "text-neutral-500 hover:text-neutral-700"
                }`}
            >
              Upgrade Plan
            </button>
            <button
                onClick={() => setActiveTab("packs")}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    activeTab === "packs"
                        ? "text-primary-red border-b-2 border-primary-red"
                        : "text-neutral-500 hover:text-neutral-700"
                }`}
            >
              Buy Message Pack
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {activeTab === "upgrade" ? (
                <div className="space-y-4">
                  <p className="text-sm text-neutral-600 mb-4">
                    Upgrade your plan for more messages every month and additional features.
                  </p>

                  {availableTiers.map((tier) => (
                      <div
                          key={tier.id}
                          className={`border rounded-xl p-4 transition-all ${
                              tier.isPopular
                                  ? "border-primary-red bg-red-50/50"
                                  : "border-neutral-200 hover:border-neutral-300"
                          } ${tier.isComingSoon ? "opacity-60" : ""}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-neutral-900">{tier.name}</h3>
                              {tier.isPopular && (
                                  <span className="px-2 py-0.5 bg-primary-red text-white text-xs rounded-full">
                            Popular
                          </span>
                              )}
                              {tier.isComingSoon && (
                                  <span className="px-2 py-0.5 bg-neutral-200 text-neutral-600 text-xs rounded-full">
                            Coming Soon
                          </span>
                              )}
                            </div>
                            <p className="text-2xl font-bold text-neutral-900 mt-1">
                              {tier.priceDisplay}
                              <span className="text-sm font-normal text-neutral-500">/month</span>
                            </p>
                            <ul className="mt-3 space-y-1.5">
                              {tier.features.slice(0, 4).map((feature, i) => (
                                  <li key={i} className="flex items-center gap-2 text-sm text-neutral-600">
                                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                                    {feature}
                                  </li>
                              ))}
                            </ul>
                          </div>
                          <Button
                              onClick={() => handleUpgrade(tier.id)}
                              disabled={tier.isComingSoon || loading !== null}
                              size="sm"
                              variant={tier.isPopular ? "default" : "outline"}
                              className="ml-4"
                          >
                            {loading === tier.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : tier.isComingSoon ? (
                                "Coming Soon"
                            ) : (
                                "Upgrade"
                            )}
                          </Button>
                        </div>
                      </div>
                  ))}
                </div>
            ) : (
                <div className="space-y-4">
                  <p className="text-sm text-neutral-600 mb-4">
                    Need a quick boost? Purchase additional messages that are added to your current month.
                  </p>

                  {MESSAGE_PACKS.map((pack) => (
                      <div
                          key={pack.id}
                          className="border border-neutral-200 rounded-xl p-4 hover:border-neutral-300 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-amber-500" />
                              <h3 className="font-semibold text-neutral-900">{pack.name}</h3>
                            </div>
                            <p className="text-sm text-neutral-500 mt-1">
                              {pack.messages.toLocaleString()} messages • {pack.perMessageCost}/message
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-neutral-900">{pack.priceDisplay}</p>
                            <Button
                                onClick={() => handleBuyPack(pack.id)}
                                disabled={loading !== null}
                                size="sm"
                                variant="outline"
                                className="mt-2"
                            >
                              {loading === pack.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                  "Buy Now"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                  ))}

                  <p className="text-xs text-neutral-400 text-center mt-4">
                    Message packs are added to your current month&apos;s allowance.
                  </p>
                </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-neutral-50 border-t border-neutral-200">
            <p className="text-xs text-neutral-500 text-center">
              Secure payment powered by Stripe. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
  );
}