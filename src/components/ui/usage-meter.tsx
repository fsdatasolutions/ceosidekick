// src/components/ui/usage-meter.tsx
"use client";

import { useEffect, useState } from "react";
import { Zap, AlertTriangle, XCircle, TrendingUp } from "lucide-react";
import Link from "next/link";

interface UsageInfo {
  tier: string;
  tierName: string;
  messagesUsed: number;
  messagesLimit: number;
  bonusMessages: number;
  totalAvailable: number;
  remaining: number;
  percentage: number;
  status: "ok" | "warning" | "critical" | "exceeded";
  canSendMessage: boolean;
}

interface UsageMeterProps {
  compact?: boolean;
  showUpgrade?: boolean;
  className?: string;
}

export function UsageMeter({ compact = false, showUpgrade = true, className = "" }: UsageMeterProps) {
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/usage");
        if (res.ok) {
          const data = await res.json();
          setUsage(data.usage);
        }
      } catch (error) {
        console.error("Failed to fetch usage:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();
  }, []);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-neutral-200 rounded w-24 mb-2" />
        <div className="h-2 bg-neutral-200 rounded w-full" />
      </div>
    );
  }

  if (!usage) {
    return null;
  }

  const statusColors = {
    ok: "bg-green-500",
    warning: "bg-yellow-500",
    critical: "bg-orange-500",
    exceeded: "bg-red-500",
  };

  const statusBgColors = {
    ok: "bg-green-100",
    warning: "bg-yellow-100",
    critical: "bg-orange-100",
    exceeded: "bg-red-100",
  };

  const statusTextColors = {
    ok: "text-green-700",
    warning: "text-yellow-700",
    critical: "text-orange-700",
    exceeded: "text-red-700",
  };

  const StatusIcon = usage.status === "exceeded" ? XCircle : 
                     usage.status === "critical" ? AlertTriangle : 
                     usage.status === "warning" ? AlertTriangle : Zap;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={`w-2 h-2 rounded-full ${statusColors[usage.status]}`} />
        <span className="text-sm text-neutral-600">
          {usage.remaining} messages left
        </span>
        {usage.status !== "ok" && showUpgrade && (
          <Link 
            href="/dashboard/settings?tab=billing" 
            className="text-xs text-primary-red hover:underline"
          >
            Upgrade
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-neutral-200 p-4 ${statusBgColors[usage.status]} ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon className={`w-4 h-4 ${statusTextColors[usage.status]}`} />
          <span className="text-sm font-medium text-neutral-900">
            {usage.tierName} Plan
          </span>
        </div>
        {showUpgrade && usage.tier !== "pro" && (
          <Link 
            href="/dashboard/settings?tab=billing"
            className="text-xs font-medium text-primary-red hover:underline flex items-center gap-1"
          >
            <TrendingUp className="w-3 h-3" />
            Upgrade
          </Link>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-white rounded-full overflow-hidden mb-2">
        <div 
          className={`h-full ${statusColors[usage.status]} transition-all duration-300`}
          style={{ width: `${Math.min(usage.percentage, 100)}%` }}
        />
      </div>

      {/* Usage text */}
      <div className="flex items-center justify-between text-xs">
        <span className={statusTextColors[usage.status]}>
          {usage.messagesUsed.toLocaleString()} / {usage.totalAvailable.toLocaleString()} messages
        </span>
        <span className="text-neutral-500">
          {usage.remaining.toLocaleString()} remaining
        </span>
      </div>

      {/* Bonus messages note */}
      {usage.bonusMessages > 0 && (
        <p className="text-xs text-neutral-500 mt-2">
          Includes {usage.bonusMessages.toLocaleString()} bonus messages
        </p>
      )}

      {/* Warning messages */}
      {usage.status === "exceeded" && (
        <div className="mt-3 p-2 bg-red-50 rounded-lg border border-red-200">
          <p className="text-xs text-red-700">
            You&apos;ve reached your message limit. 
            <Link href="/dashboard/settings?tab=billing" className="font-medium underline ml-1">
              Upgrade or buy more messages
            </Link>
          </p>
        </div>
      )}

      {usage.status === "critical" && (
        <div className="mt-3 p-2 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-xs text-orange-700">
            Running low on messages! Consider upgrading your plan.
          </p>
        </div>
      )}
    </div>
  );
}

// Hook for programmatic usage checks
export function useUsage() {
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data.usage);
        setError(null);
      } else {
        setError("Failed to fetch usage");
      }
    } catch (err) {
      setError("Failed to fetch usage");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  return { usage, loading, error, refetch: fetchUsage };
}
