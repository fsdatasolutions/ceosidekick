// src/lib/tiers.ts
// Subscription tiers and credit pack configuration
// Single source of truth for all pricing, limits, and feature gating

export type TierType = "free" | "power" | "pro" | "team";

export interface TierConfig {
  id: TierType;
  name: string;
  price: number; // Monthly price in cents
  priceDisplay: string;
  creditsPerMonth: number;
  companyLibraryStorageMB: number; // RAG document storage limit
  features: string[];
  description?: string; // For marketing/landing pages
  isPopular?: boolean;
  isComingSoon?: boolean;
  stripePriceId?: string; // Set in env vars for production
}

export interface CreditPackConfig {
  id: string;
  name: string;
  credits: number;
  price: number; // Price in cents
  priceDisplay: string;
  perCreditCost: string;
  stripePriceId?: string;
}

// ===========================================
// FEATURE GATING
// ===========================================
// Free:      Chat with all 7 AI advisors
// Paid:      + Company Library (RAG), Business Document Templates, Round Table

export const PAID_FEATURES = [
  "Company Library — upload & search your documents",
  "Business Document Templates",
  "Round Table — multi-advisor boardroom",
] as const;

// ===========================================
// SUBSCRIPTION TIERS
// ===========================================

export const TIERS: Record<TierType, TierConfig> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    priceDisplay: "$0",
    creditsPerMonth: 30,
    companyLibraryStorageMB: 0,
    description: "Perfect for trying out CEO Sidekick",
    features: [
      "30 credits/month",
      "All 7 AI advisors",
    ],
  },
  power: {
    id: "power",
    name: "PowerUser",
    price: 2900, // $29.00
    priceDisplay: "$29",
    creditsPerMonth: 250,
    companyLibraryStorageMB: 100,
    description: "For solo entrepreneurs getting serious",
    features: [
      "250 credits/month",
      "All 7 AI advisors",
      "Company Library — 100MB document storage",
      "Business Document Templates",
      "Round Table — multi-advisor boardroom",
    ],
    isPopular: true,
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 19900, // $199.00
    priceDisplay: "$199",
    creditsPerMonth: 2500,
    companyLibraryStorageMB: 500,
    description: "For growing businesses that need more",
    features: [
      "2,500 credits/month",
      "All 7 AI advisors",
      "Company Library — 500MB document storage",
      "Business Document Templates",
      "Round Table — multi-advisor boardroom",
    ],
  },
  team: {
    id: "team",
    name: "Team",
    price: 50000, // $500.00
    priceDisplay: "$500",
    creditsPerMonth: 15000,
    companyLibraryStorageMB: 2048, // 2GB
    description: "Custom solutions for teams",
    features: [
      "15,000 credits/month",
      "All 7 AI advisors",
      "Company Library — 2GB document storage",
      "Business Document Templates",
      "Round Table — multi-advisor boardroom",
      "Multiple team members",
      "Shared knowledge base",
    ],
    isComingSoon: true,
  },
};

// ===========================================
// CREDIT PACKS (One-time purchases)
// ===========================================

export const CREDIT_PACKS: CreditPackConfig[] = [
  {
    id: "boost",
    name: "Boost Pack",
    credits: 250,
    price: 1500, // $15.00
    priceDisplay: "$15",
    perCreditCost: "$0.06",
  },
  {
    id: "power_pack",
    name: "Power Pack",
    credits: 1000,
    price: 5000, // $50.00
    priceDisplay: "$50",
    perCreditCost: "$0.05",
  },
  {
    id: "bulk",
    name: "Bulk Pack",
    credits: 2500,
    price: 9000, // $90.00
    priceDisplay: "$90",
    perCreditCost: "$0.036",
  },
];

// ===========================================
// HELPER FUNCTIONS
// ===========================================

export function getTier(tierId: TierType | string): TierConfig {
  return TIERS[tierId as TierType] || TIERS.free;
}

export function getCreditPack(packId: string): CreditPackConfig | undefined {
  return CREDIT_PACKS.find((pack) => pack.id === packId);
}

export function getTierByStripePriceId(priceId: string): TierConfig | undefined {
  return Object.values(TIERS).find((tier) => tier.stripePriceId === priceId);
}

/** Check if a tier has access to paid features (Company Library, Templates, Round Table) */
export function hasPaidFeatures(tierId: TierType | string): boolean {
  return tierId !== "free";
}

/** Get the Company Library storage limit in bytes for a tier */
export function getStorageLimitBytes(tierId: TierType | string): number {
  const tier = getTier(tierId);
  return tier.companyLibraryStorageMB * 1024 * 1024;
}

export function formatCreditCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(count % 1000 === 0 ? 0 : 1)}k`;
  }
  return count.toString();
}

export function getUsagePercentage(used: number, limit: number): number {
  if (limit === 0) return 100;
  return Math.min(Math.round((used / limit) * 100), 100);
}

export function getUsageStatus(
    used: number,
    limit: number
): "ok" | "warning" | "critical" | "exceeded" {
  const percentage = getUsagePercentage(used, limit);
  if (percentage >= 100) return "exceeded";
  if (percentage >= 90) return "critical";
  if (percentage >= 75) return "warning";
  return "ok";
}

// Available tiers for display (excludes coming soon by default)
export function getAvailableTiers(includeComingSoon = false): TierConfig[] {
  return Object.values(TIERS).filter(
      (tier) => includeComingSoon || !tier.isComingSoon
  );
}

// ===========================================
// LANDING PAGE HELPERS
// ===========================================

export interface LandingPagePlan {
  name: string;
  description: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  ctaVariant: "default" | "outline" | "secondary";
  popular: boolean;
  comingSoon: boolean;
  tierId: TierType;
}

export function getTiersForLandingPage(): LandingPagePlan[] {
  return Object.values(TIERS).map((tier) => ({
    name: tier.name,
    description: tier.description || "",
    price: tier.priceDisplay,
    period: tier.price === 0 ? "forever" : "/month",
    features: tier.features,
    cta: tier.isComingSoon
        ? "Coming Soon"
        : tier.price === 0
            ? "Get Started"
            : "Start Free Trial",
    ctaVariant: tier.isPopular
        ? "default"
        : tier.isComingSoon
            ? "secondary"
            : "outline",
    popular: tier.isPopular || false,
    comingSoon: tier.isComingSoon || false,
    tierId: tier.id,
  }));
}
