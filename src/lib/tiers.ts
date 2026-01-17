// src/lib/tiers.ts
// Subscription tiers and message pack configuration

export type TierType = "free" | "power" | "pro" | "team";

export interface TierConfig {
  id: TierType;
  name: string;
  price: number; // Monthly price in cents
  priceDisplay: string;
  messagesPerMonth: number;
  documentStorageMB: number;
  features: string[];
  isPopular?: boolean;
  isComingSoon?: boolean;
  stripePriceId?: string; // Set in env vars for production
}

export interface MessagePackConfig {
  id: string;
  name: string;
  messages: number;
  price: number; // Price in cents
  priceDisplay: string;
  perMessageCost: string;
  stripePriceId?: string;
}

// ===========================================
// SUBSCRIPTION TIERS
// ===========================================

export const TIERS: Record<TierType, TierConfig> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    priceDisplay: "$0",
    messagesPerMonth: 50,
    documentStorageMB: 10,
    features: [
      "50 messages/month",
      "All 8 AI advisors",
      "10MB document storage",
      "Email support",
    ],
  },
  power: {
    id: "power",
    name: "PowerUser",
    price: 2900, // $29.00
    priceDisplay: "$29",
    messagesPerMonth: 1000,
    documentStorageMB: 100,
    features: [
      "1,000 messages/month",
      "All 8 AI advisors",
      "100MB document storage",
      "Priority email support",
      "Conversation export",
    ],
    isPopular: true,
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 19900, // $199.00
    priceDisplay: "$199",
    messagesPerMonth: 10000,
    documentStorageMB: 500,
    features: [
      "10,000 messages/month",
      "All 8 AI advisors",
      "500MB document storage",
      "Priority support",
      "Conversation export",
      "API access",
      "Custom integrations",
    ],
  },
  team: {
    id: "team",
    name: "Team",
    price: 50000, // $500.00
    priceDisplay: "$500",
    messagesPerMonth: 15000,
    documentStorageMB: 2048, // 2GB
    features: [
      "15,000 messages/month",
      "All 8 AI advisors",
      "2GB document storage",
      "Multiple team members",
      "Shared knowledge base",
      "Admin dashboard",
      "Dedicated support",
    ],
    isComingSoon: true,
  },
};

// ===========================================
// MESSAGE PACKS (One-time purchases)
// ===========================================

export const MESSAGE_PACKS: MessagePackConfig[] = [
  {
    id: "boost",
    name: "Boost Pack",
    messages: 250,
    price: 1500, // $15.00
    priceDisplay: "$15",
    perMessageCost: "$0.06",
  },
  {
    id: "power_pack",
    name: "Power Pack",
    messages: 1000,
    price: 5000, // $50.00
    priceDisplay: "$50",
    perMessageCost: "$0.05",
  },
  {
    id: "bulk",
    name: "Bulk Pack",
    messages: 2500,
    price: 9000, // $90.00
    priceDisplay: "$90",
    perMessageCost: "$0.036",
  },
];

// ===========================================
// HELPER FUNCTIONS
// ===========================================

export function getTier(tierId: TierType | string): TierConfig {
  return TIERS[tierId as TierType] || TIERS.free;
}

export function getMessagePack(packId: string): MessagePackConfig | undefined {
  return MESSAGE_PACKS.find((pack) => pack.id === packId);
}

export function getTierByStripePriceId(priceId: string): TierConfig | undefined {
  return Object.values(TIERS).find((tier) => tier.stripePriceId === priceId);
}

export function formatMessageCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(count % 1000 === 0 ? 0 : 1)}k`;
  }
  return count.toString();
}

export function getUsagePercentage(used: number, limit: number): number {
  if (limit === 0) return 100;
  return Math.min(Math.round((used / limit) * 100), 100);
}

export function getUsageStatus(used: number, limit: number): "ok" | "warning" | "critical" | "exceeded" {
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