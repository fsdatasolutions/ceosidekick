// src/app/(dashboard)/dashboard/page.tsx
// Dashboard with subscription tier and usage tracking
// Updated to use centralized agent configuration

import Link from "next/link";
import { auth } from "@/lib/auth";
import { eq, and, desc, count } from "drizzle-orm";
import {
  ArrowRight,
  MessageSquare,
  Clock,
  Sparkles,
  BookOpen,
  Zap,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentAvatar } from "@/components/ui/agent-avatar";
import { UsageMeter } from "@/components/ui/usage-meter";
import { getUserUsage, UsageInfo } from "@/lib/usage";
import { getTier } from "@/lib/tiers";

// ============================================
// IMPORT FROM CENTRALIZED CONFIG
// ============================================
import { AGENTS, type AgentType } from "@/config/agent-config";

// Lazy load database to avoid build-time errors
async function getDb() {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  const { db } = await import("@/db");
  return db;
}

async function getSchema() {
  const { conversations, messages, documents, userSettings } = await import("@/db/schema");
  return { conversations, messages, documents, userSettings };
}

// ============================================
// DASHBOARD AGENTS LIST
// Derived from centralized config
// ============================================
const dashboardAgents = Object.values(AGENTS).map((agent) => ({
  id: agent.id,
  name: agent.name,
  subtitle: agent.subtitle,
  description: agent.description,
  href: agent.id === "content"
      ? "https://ce.ceosidekick.biz"  // Content Engine external link
      : `/chat?agent=${agent.id}`,
  external: agent.id === "content",
}));

// ============================================
// AGENT NAMES LOOKUP
// Derived from centralized config for conversation display
// ============================================
const agentNames: Record<string, string> = Object.fromEntries(
    Object.values(AGENTS).map((agent) => [agent.id, agent.name])
);

async function getDashboardData(userId: string) {
  const db = await getDb();

  if (!db) {
    return null;
  }

  const { conversations, documents, userSettings } = await getSchema();

  // Fetch all data in parallel
  const [
    conversationCount,
    documentCount,
    recentConversations,
    settings,
  ] = await Promise.all([
    // Count active conversations (not archived)
    db
        .select({ count: count() })
        .from(conversations)
        .where(
            and(
                eq(conversations.userId, userId),
                eq(conversations.isArchived, false)
            )
        ),

    // Count documents
    db
        .select({ count: count() })
        .from(documents)
        .where(eq(documents.userId, userId)),

    // Get recent conversations
    db
        .select({
          id: conversations.id,
          agent: conversations.agent,
          title: conversations.title,
          lastMessageAt: conversations.lastMessageAt,
          messageCount: conversations.messageCount,
        })
        .from(conversations)
        .where(
            and(
                eq(conversations.userId, userId),
                eq(conversations.isArchived, false)
            )
        )
        .orderBy(desc(conversations.lastMessageAt))
        .limit(5),

    // Get user settings to check completion
    db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1),
  ]);

  // Calculate settings completion
  const userSettingsData = settings[0];
  const settingsSections = {
    profile: !!(userSettingsData?.userRole || userSettingsData?.yearsExperience || userSettingsData?.areasOfFocus),
    company: !!(userSettingsData?.companyName || userSettingsData?.industry),
    context: !!(userSettingsData?.currentChallenges || userSettingsData?.shortTermGoals || userSettingsData?.techStack),
    preferences: !!(userSettingsData?.communicationStyle || userSettingsData?.responseLength),
  };

  const sectionsComplete = Object.values(settingsSections).filter(Boolean).length;

  return {
    conversationCount: conversationCount[0]?.count ?? 0,
    documentCount: documentCount[0]?.count ?? 0,
    recentConversations,
    settingsComplete: sectionsComplete,
    hasSettings: !!userSettingsData,
    companyName: userSettingsData?.companyName || null,
  };
}

function formatRelativeTime(date: Date | null): string {
  if (!date) return "Never";

  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  let dashboardData = {
    conversationCount: 0,
    documentCount: 0,
    recentConversations: [] as {
      id: string;
      agent: string;
      title: string | null;
      lastMessageAt: Date | null;
      messageCount: number;
    }[],
    settingsComplete: 0,
    hasSettings: false,
    companyName: null as string | null,
  };

  // Default usage for non-authenticated users
  let usageData: UsageInfo = {
    tier: "free",
    tierName: "Free",
    messagesUsed: 0,
    messagesLimit: 50,
    bonusMessages: 0,
    totalAvailable: 50,
    remaining: 50,
    percentage: 0,
    status: "ok",
    canSendMessage: true,
    period: "",
  };

  if (userId) {
    try {
      const [data, usage] = await Promise.all([
        getDashboardData(userId),
        getUserUsage(userId),
      ]);

      if (data) {
        dashboardData = data;
      }
      usageData = usage;
    } catch (error) {
      console.error("[Dashboard] Failed to fetch data:", error);
    }
  }

  const {
    conversationCount,
    documentCount,
    recentConversations,
    settingsComplete,
    hasSettings,
    companyName,
  } = dashboardData;

  const tier = getTier(usageData.tier);
  const showUpgradePrompt = usageData.status === "warning" || usageData.status === "critical" || usageData.status === "exceeded";

  return (
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">
            Welcome back, {firstName}
          </h1>
          <p className="text-neutral-600">
            {companyName
                ? `Managing ${companyName} — What would you like to work on today?`
                : "What would you like to work on today?"
            }
          </p>
        </div>

        {/* Usage Alert - Show when approaching or at limit */}
        {showUpgradePrompt && (
            <div className={`mb-8 p-5 rounded-xl border ${
                usageData.status === "exceeded"
                    ? "bg-red-50 border-red-200"
                    : "bg-amber-50 border-amber-200"
            }`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    usageData.status === "exceeded" ? "bg-red-100" : "bg-amber-100"
                }`}>
                  <Zap className={`w-6 h-6 ${
                      usageData.status === "exceeded" ? "text-red-600" : "text-amber-600"
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    {usageData.status === "exceeded"
                        ? "Message Limit Reached"
                        : "Running Low on Messages"
                    }
                  </h3>
                  <p className="text-sm text-neutral-600 mb-3">
                    {usageData.status === "exceeded"
                        ? `You've used all ${usageData.totalAvailable} messages this month. Upgrade your plan or buy a message pack to continue.`
                        : `You've used ${usageData.messagesUsed} of ${usageData.totalAvailable} messages (${usageData.percentage}%). Consider upgrading for more.`
                    }
                  </p>
                  <div className="flex gap-2">
                    <Link href="/pricing">
                      <Button size="sm">
                        <TrendingUp className="w-4 h-4" />
                        Upgrade Plan
                      </Button>
                    </Link>
                    <Link href="/pricing#packs">
                      <Button size="sm" variant="outline">
                        Buy Message Pack
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Settings Prompt - Show if settings incomplete */}
        {settingsComplete < 4 && !showUpgradePrompt && (
            <div className="mb-8 p-5 bg-gradient-to-r from-primary-red/10 to-amber-500/10 border border-primary-red/20 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary-red/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-primary-red" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 mb-1">
                    {!hasSettings ? "Personalize Your AI Advisors" : "Complete Your Setup"}
                  </h3>
                  <p className="text-sm text-neutral-600 mb-3">
                    {!hasSettings
                        ? "Add your business context to get tailored advice from all AI advisors."
                        : "Finish setting up your profile to get the most personalized recommendations."
                    }
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white/50 rounded-full h-2 max-w-xs">
                      <div
                          className="bg-primary-red h-2 rounded-full transition-all"
                          style={{ width: `${(settingsComplete / 4) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-neutral-700">{settingsComplete}/4 sections</span>
                  </div>
                </div>
                <Link href="/settings">
                  <Button size="sm">
                    {!hasSettings ? "Get Started" : "Continue Setup"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
        )}

        {/* Quick Stats - Now with real usage data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Messages Usage Card */}
          <div className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-neutral-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-neutral-900">{usageData.messagesUsed}</span>
                  <span className="text-sm text-neutral-400">/ {usageData.totalAvailable}</span>
                </div>
                <p className="text-sm text-neutral-500">Messages This Month</p>
              </div>
            </div>
            {/* Usage Progress Bar */}
            <div className="w-full bg-neutral-100 rounded-full h-2">
              <div
                  className={`h-2 rounded-full transition-all ${
                      usageData.status === "exceeded" ? "bg-red-500" :
                          usageData.status === "critical" ? "bg-red-500" :
                              usageData.status === "warning" ? "bg-amber-500" :
                                  "bg-primary-red"
                  }`}
                  style={{ width: `${Math.min(usageData.percentage, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-neutral-500">
              {tier.name} Plan
            </span>
              {usageData.bonusMessages > 0 && (
                  <span className="text-xs text-green-600">
                +{usageData.bonusMessages} bonus
              </span>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{conversationCount}</p>
              <p className="text-sm text-neutral-500">Active Conversations</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">{documentCount}</p>
              <p className="text-sm text-neutral-500">Documents in Library</p>
            </div>
          </div>
        </div>

        {/* AI Advisors - Now using dashboardAgents derived from centralized config */}
        <div className="mb-8">
          <h2 className="font-display text-xl font-semibold text-neutral-900 mb-4">
            AI Advisors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardAgents.map((agent) => (
                <Link
                    key={agent.id}
                    href={agent.href}
                    target={agent.external ? "_blank" : undefined}
                    className="group bg-white rounded-xl border border-neutral-200 p-5 hover:border-neutral-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <AgentAvatar agentId={agent.id} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-neutral-900 group-hover:text-primary-red transition-colors">
                          {agent.name}
                        </h3>
                        {agent.external && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">
                        External
                      </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mb-1">{agent.subtitle}</p>
                      <p className="text-sm text-neutral-600 line-clamp-2">
                        {agent.description}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-red group-hover:translate-x-1 transition-all" />
                  </div>
                </Link>
            ))}
          </div>
        </div>

        {/* Recent Conversations */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-neutral-900">
              Recent Conversations
            </h2>
            {recentConversations.length > 0 && (
                <Link href="/chat">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
            )}
          </div>

          {recentConversations.length > 0 ? (
              <div className="bg-white rounded-xl border border-neutral-200 divide-y divide-neutral-100">
                {recentConversations.map((conversation) => {
                  const agentName = agentNames[conversation.agent] || conversation.agent;

                  return (
                      <Link
                          key={conversation.id}
                          href={`/chat?agent=${conversation.agent}&id=${conversation.id}`}
                          className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors"
                      >
                        <AgentAvatar agentId={conversation.agent} size="md" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-neutral-900 truncate">
                              {conversation.title || "Untitled conversation"}
                            </h3>
                            <span className="text-xs text-neutral-400 flex-shrink-0">
                        {formatRelativeTime(conversation.lastMessageAt)}
                      </span>
                          </div>
                          <p className="text-sm text-neutral-500">
                            {agentName} • {conversation.messageCount} messages
                          </p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-neutral-400" />
                      </Link>
                  );
                })}
              </div>
          ) : (
              <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-6 h-6 text-neutral-400" />
                </div>
                <h3 className="font-medium text-neutral-900 mb-2">No conversations yet</h3>
                <p className="text-sm text-neutral-500 mb-4">
                  Start chatting with an AI advisor to see your conversations here.
                </p>
                <Link href="/chat?agent=technology">
                  <Button>
                    Start Your First Chat
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
          )}
        </div>
      </div>
  );
}