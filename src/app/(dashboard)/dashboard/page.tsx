// src/app/(dashboard)/dashboard/page.tsx
// Dashboard command center with access to all features
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
  FileText,
  FolderOpen,
  MessagesSquare,
  Crown,
  PenTool,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentAvatar } from "@/components/ui/agent-avatar";
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
// Content Engine excluded — it has its own feature card
// ============================================
const dashboardAgents = Object.values(AGENTS)
    .filter((agent) => agent.id !== "content")
    .map((agent) => ({
      id: agent.id,
      name: agent.name,
      subtitle: agent.subtitle,
      description: agent.description,
      href: `/chat?agent=${agent.id}`,
      external: false,
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
  const isPaidUser = usageData.tier === "power" || usageData.tier === "pro" || usageData.tier === "team";

  return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
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

        {/* Quick Stats Row */}
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

        {/* ============================================ */}
        {/* FEATURE CARDS - Primary access to all tools */}
        {/* ============================================ */}
        <div className="mb-8">
          <h2 className="font-display text-xl font-semibold text-neutral-900 mb-4">
            Your Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Chat with Advisors */}
            <Link
                href="/chat"
                className="group relative bg-white rounded-xl border border-neutral-200 p-5 hover:border-primary-red/30 hover:shadow-lg hover:shadow-primary-red/5 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-primary-red/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary-red" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-primary-red transition-colors" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1 group-hover:text-primary-red transition-colors">
                Chat with Advisors
              </h3>
              <p className="text-sm text-neutral-500 mb-3">
                Get expert guidance from your AI C-suite on strategy, tech, legal, HR, and more.
              </p>
              {/* Mini advisor avatars */}
              <div className="flex items-center gap-1">
                {dashboardAgents.slice(0, 5).map((agent, i) => (
                    <div key={agent.id} className="w-7 h-7 -ml-1 first:ml-0 ring-2 ring-white rounded-full overflow-hidden">
                      <AgentAvatar agentId={agent.id} size="sm" />
                    </div>
                ))}
                {dashboardAgents.length > 5 && (
                    <span className="text-xs text-neutral-400 ml-1.5">
                  +{dashboardAgents.length - 5} more
                </span>
                )}
              </div>
            </Link>

            {/* Templates */}
            <Link
                href="/documents"
                className="group relative bg-white rounded-xl border border-neutral-200 p-5 hover:border-teal-300 hover:shadow-lg hover:shadow-teal-500/5 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-teal-600" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-teal-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1 group-hover:text-teal-700 transition-colors">
                Templates
              </h3>
              <p className="text-sm text-neutral-500 mb-3">
                Generate professional business documents, contracts, plans, and more from templates.
              </p>
              <span className="text-xs text-teal-600 font-medium">
              Browse Templates →
            </span>
            </Link>

            {/* Company Library (Knowledge Base) */}
            <Link
                href="/knowledge-base"
                className="group relative bg-white rounded-xl border border-neutral-200 p-5 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-blue-600" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-blue-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1 group-hover:text-blue-700 transition-colors">
                Company Library
              </h3>
              <p className="text-sm text-neutral-500 mb-3">
                Upload and manage documents so your advisors can reference your business context.
              </p>
              {documentCount > 0 ? (
                  <span className="text-xs text-blue-600 font-medium">
                {documentCount} document{documentCount !== 1 ? "s" : ""} uploaded
              </span>
              ) : (
                  <span className="text-xs text-neutral-400">
                No documents yet — get started
              </span>
              )}
            </Link>

            {/* Content Engine */}
            <Link
                href="/content-engine"
                className="group relative bg-white rounded-xl border border-neutral-200 p-5 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/5 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">
                  <PenTool className="w-5 h-5 text-purple-600" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-purple-600 transition-colors" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-1 group-hover:text-purple-700 transition-colors">
                Content Engine
              </h3>
              <p className="text-sm text-neutral-500 mb-3">
                Create blog posts, social media content, newsletters, and marketing copy with AI.
              </p>
              <span className="text-xs text-purple-600 font-medium">
              Create Content →
            </span>
            </Link>

            {/* Round Table */}
            {isPaidUser ? (
                <Link
                    href="/roundtable"
                    className="group relative bg-white rounded-xl border border-neutral-200 p-5 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/5 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
                      <MessagesSquare className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                    New
                  </span>
                      <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-amber-600 transition-colors" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-1 group-hover:text-amber-700 transition-colors">
                    Round Table
                  </h3>
                  <p className="text-sm text-neutral-500 mb-3">
                    Get multi-perspective guidance from multiple advisors in a single conversation.
                  </p>
                  <span className="text-xs text-amber-600 font-medium">
                Start a Round Table →
              </span>
                </Link>
            ) : (
                <div className="group relative bg-neutral-50 rounded-xl border border-neutral-200 border-dashed p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center">
                      <MessagesSquare className="w-5 h-5 text-neutral-400" />
                    </div>
                    <Crown className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-neutral-500 mb-1">
                    Round Table
                  </h3>
                  <p className="text-sm text-neutral-400 mb-3">
                    Get multi-perspective guidance from multiple advisors in a single conversation.
                  </p>
                  <Link href="/pricing" className="text-xs text-amber-600 font-medium hover:text-amber-700 transition-colors">
                    Upgrade to unlock →
                  </Link>
                </div>
            )}
          </div>
        </div>

        {/* ============================================ */}
        {/* AI ADVISORS - Quick access grid             */}
        {/* ============================================ */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold text-neutral-900">
              AI Advisors
            </h2>
            <Link href="/chat">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardAgents.map((agent) => (
                <Link
                    key={agent.id}
                    href={agent.href}
                    className="group bg-white rounded-xl border border-neutral-200 p-5 hover:border-neutral-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <AgentAvatar agentId={agent.id} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900 group-hover:text-primary-red transition-colors">
                        {agent.name}
                      </h3>
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

        {/* ============================================ */}
        {/* RECENT CONVERSATIONS                        */}
        {/* ============================================ */}
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