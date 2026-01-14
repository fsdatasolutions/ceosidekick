import Link from "next/link";
import { auth } from "@/lib/auth";
import { eq, and, gte, desc, count } from "drizzle-orm";
import {
  Cpu,
  Target,
  Scale,
  Users,
  BookOpen,
  PenTool,
  ArrowRight,
  MessageSquare,
  Clock,
  Sparkles,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

const agents = [
  {
    id: "technology",
    name: "Technology Partner",
    subtitle: "Virtual CTO/CIO",
    icon: Cpu,
    color: "bg-accent-teal",
    description: "Technology strategy and digital transformation",
    href: "/chat?agent=technology",
  },
  {
    id: "coach",
    name: "Executive Coach",
    subtitle: "Leadership Partner",
    icon: Target,
    color: "bg-agent-coach",
    description: "Leadership development and strategic thinking",
    href: "/chat?agent=coach",
  },
  {
    id: "legal",
    name: "Legal Advisor",
    subtitle: "Contract & Compliance",
    icon: Scale,
    color: "bg-agent-legal",
    description: "Contract review and compliance guidance",
    href: "/chat?agent=legal",
  },
  {
    id: "hr",
    name: "HR Partner",
    subtitle: "People Operations",
    icon: Users,
    color: "bg-agent-hr",
    description: "Job descriptions and HR policy development",
    href: "/chat?agent=hr",
  },
  {
    id: "marketing",
    name: "Marketing Partner",
    subtitle: "Growth & Brand",
    icon: TrendingUp,
    color: "bg-pink-600",
    description: "Marketing strategy and brand development",
    href: "/chat?agent=marketing",
  },
  {
    id: "sales",
    name: "Sales Partner",
    subtitle: "Revenue & Deals",
    icon: DollarSign,
    color: "bg-orange-600",
    description: "Sales strategy and pipeline management",
    href: "/chat?agent=sales",
  },
  {
    id: "knowledge",
    name: "Knowledge Base",
    subtitle: "Company AI",
    icon: BookOpen,
    color: "bg-agent-knowledge",
    description: "Ask questions about your uploaded documents",
    href: "/chat?agent=knowledge",
  },
  {
    id: "content",
    name: "Content Engine",
    subtitle: "Thought Leadership",
    icon: PenTool,
    color: "bg-primary-red",
    description: "AI-powered content generation",
    href: "https://ce.ceosidekick.biz",
    external: true,
  },
];

const agentIcons: Record<string, typeof Cpu> = {
  technology: Cpu,
  coach: Target,
  legal: Scale,
  hr: Users,
  marketing: TrendingUp,
  sales: DollarSign,
  knowledge: BookOpen,
  content: PenTool,
};

const agentColors: Record<string, string> = {
  technology: "bg-accent-teal",
  coach: "bg-agent-coach",
  legal: "bg-agent-legal",
  hr: "bg-agent-hr",
  marketing: "bg-pink-600",
  sales: "bg-orange-600",
  knowledge: "bg-agent-knowledge",
  content: "bg-primary-red",
};

const agentNames: Record<string, string> = {
  technology: "Technology Partner",
  coach: "Executive Coach",
  legal: "Legal Advisor",
  hr: "HR Partner",
  marketing: "Marketing Partner",
  sales: "Sales Partner",
  knowledge: "Knowledge Base",
  content: "Content Engine",
};

async function getDashboardData(userId: string) {
  const db = await getDb();

  if (!db) {
    return null;
  }

  const { conversations, messages, documents, userSettings } = await getSchema();

  // Get start of current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch all data in parallel
  const [
    messagesThisMonth,
    conversationCount,
    documentCount,
    recentConversations,
    settings,
  ] = await Promise.all([
    // Count messages this month (user messages only)
    db
        .select({ count: count() })
        .from(messages)
        .innerJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(
            and(
                eq(conversations.userId, userId),
                eq(messages.role, "user"),
                gte(messages.createdAt, startOfMonth)
            )
        ),

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
  const settingsComplete = Object.values(settingsSections).filter(Boolean).length;

  return {
    messagesThisMonth: messagesThisMonth[0]?.count || 0,
    conversationCount: conversationCount[0]?.count || 0,
    documentCount: documentCount[0]?.count || 0,
    recentConversations,
    settingsComplete,
    hasSettings: !!userSettingsData,
    companyName: userSettingsData?.companyName,
  };
}

function formatRelativeTime(date: Date | null): string {
  if (!date) return "Never";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
}

// Type for recent conversations
type RecentConversation = {
  id: string;
  agent: string;
  title: string | null;
  lastMessageAt: Date | null;
  messageCount: number;
};

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  // Default data for when there's no user or database issues
  let dashboardData = {
    messagesThisMonth: 0,
    conversationCount: 0,
    documentCount: 0,
    recentConversations: [] as RecentConversation[],
    settingsComplete: 0,
    hasSettings: false,
    companyName: null as string | null,
  };

  if (userId) {
    try {
      const data = await getDashboardData(userId);
      if (data) {
        dashboardData = data;
      }
    } catch (error) {
      console.error("[Dashboard] Failed to fetch data:", error);
    }
  }

  const {
    messagesThisMonth,
    conversationCount,
    documentCount,
    recentConversations,
    settingsComplete,
    hasSettings,
    companyName,
  } = dashboardData;

  // Message limit based on plan (default to free tier)
  const messageLimit = 500;

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

        {/* Settings Prompt - Show if settings incomplete */}
        {settingsComplete < 4 && (
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

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-neutral-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">
                {messagesThisMonth} <span className="text-sm font-normal text-neutral-400">/ {messageLimit}</span>
              </p>
              <p className="text-sm text-neutral-500">Messages This Month</p>
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
              <p className="text-sm text-neutral-500">Documents Indexed</p>
            </div>
          </div>
        </div>

        {/* AI Advisors */}
        <div className="mb-8">
          <h2 className="font-display text-xl font-semibold text-neutral-900 mb-4">
            AI Advisors
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
                <Link
                    key={agent.id}
                    href={agent.href}
                    target={agent.external ? "_blank" : undefined}
                    className="group bg-white rounded-xl border border-neutral-200 p-5 hover:border-neutral-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${agent.color} flex items-center justify-center flex-shrink-0`}>
                      <agent.icon className="w-6 h-6 text-white" />
                    </div>
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
                  const AgentIcon = agentIcons[conversation.agent] || Cpu;
                  const agentColor = agentColors[conversation.agent] || "bg-neutral-500";
                  const agentName = agentNames[conversation.agent] || conversation.agent;

                  return (
                      <Link
                          key={conversation.id}
                          href={`/chat?agent=${conversation.agent}&id=${conversation.id}`}
                          className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors"
                      >
                        <div className={`w-10 h-10 rounded-lg ${agentColor} flex items-center justify-center flex-shrink-0`}>
                          <AgentIcon className="w-5 h-5 text-white" />
                        </div>
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