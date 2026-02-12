// src/app/(dashboard)/roundtable/page.tsx
// Round Table - C-Suite Boardroom Chat Interface
"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UsageMeter } from "@/components/ui/usage-meter";
import { UpgradeModal } from "@/components/ui/upgrade-modal";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    MessagesSquare,
    Send,
    Loader2,
    Plus,
    ChevronDown,
    ChevronRight,
    Users,
    Crown,
    Sparkles,
    Check,
    AlertCircle,
    Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================
// TYPES
// ============================================

type AgentType = "technology" | "coach" | "legal" | "hr" | "marketing" | "sales" | "knowledge" | "content" | "roundtable";

interface AdvisorInfo {
    id: string;
    name: string;
    relevance: number;
    reason: string;
}

interface AdvisorResponse {
    advisorId: string;
    advisorName: string;
    response: string;
    tokensUsed: number;
    relevanceScore: number;
}

interface RoundTableMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    advisorResponses?: AdvisorResponse[];
    advisorsConsulted?: AdvisorInfo[];
    messagesCharged?: number;
    createdAt: Date;
}

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

// ============================================
// ADVISOR METADATA (using centralized agent-config avatars)
// ============================================

const ADVISOR_META: Record<
    string,
    { color: string; bgColor: string; borderColor: string; name: string; avatarUrl: string }
> = {
    technology: {
        color: "text-teal-700",
        bgColor: "bg-teal-50",
        borderColor: "border-teal-200",
        name: "Technology Partner",
        avatarUrl: "/images/avatars/technology-partner.png",
    },
    coach: {
        color: "text-purple-700",
        bgColor: "bg-purple-50",
        borderColor: "border-purple-200",
        name: "Executive Coach",
        avatarUrl: "/images/avatars/executive-coach.png",
    },
    legal: {
        color: "text-blue-700",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        name: "Legal Advisor",
        avatarUrl: "/images/avatars/legal-advisor.png",
    },
    hr: {
        color: "text-green-700",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        name: "HR Partner",
        avatarUrl: "/images/avatars/hr-partner.png",
    },
    marketing: {
        color: "text-pink-700",
        bgColor: "bg-pink-50",
        borderColor: "border-pink-200",
        name: "Marketing Partner",
        avatarUrl: "/images/avatars/marketing-partner.png",
    },
    sales: {
        color: "text-orange-700",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        name: "Sales Partner",
        avatarUrl: "/images/avatars/sales-partner.png",
    },
};

const ELIGIBLE_ADVISORS = [
    { id: "technology", name: "Technology Partner" },
    { id: "coach", name: "Executive Coach" },
    { id: "legal", name: "Legal Advisor" },
    { id: "hr", name: "HR Partner" },
    { id: "marketing", name: "Marketing Partner" },
    { id: "sales", name: "Sales Partner" },
];

const suggestedPrompts = [
    "I'm thinking about expanding into a new market — what should I consider?",
    "How should I approach my first enterprise deal?",
    "We need to hire 5 people this quarter on a tight budget",
    "Should I raise prices or add a new tier?",
    "I'm considering taking on outside investment — pros and cons?",
    "How do I set up a performance review process from scratch?",
];

// ============================================
// ADVISOR SELECTOR COMPONENT
// ============================================

function AdvisorSelector({
                             selected,
                             onToggle,
                             disabled,
                         }: {
    selected: string[];
    onToggle: (id: string) => void;
    disabled: boolean;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-neutral-200 hover:border-amber-300 hover:bg-amber-50 transition-colors disabled:opacity-50"
            >
                <Users className="w-4 h-4 text-amber-600" />
                <span className="text-neutral-600">
          {selected.length === 0
              ? "Auto-select advisors"
              : `${selected.length} advisor${selected.length > 1 ? "s" : ""} selected`}
        </span>
                <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute bottom-full mb-2 left-0 w-72 bg-white rounded-xl shadow-lg border border-neutral-200 p-2 z-20">
                        <div className="px-3 py-2 border-b border-neutral-100 mb-1">
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                                Choose advisors or leave empty for auto-select
                            </p>
                        </div>
                        {ELIGIBLE_ADVISORS.map((advisor) => {
                            const meta = ADVISOR_META[advisor.id];
                            const isSelected = selected.includes(advisor.id);

                            return (
                                <button
                                    key={advisor.id}
                                    onClick={() => onToggle(advisor.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                        isSelected
                                            ? `${meta?.bgColor || "bg-neutral-50"} ${meta?.borderColor || "border-neutral-200"} border`
                                            : "hover:bg-neutral-50"
                                    }`}
                                >
                                    <img
                                        src={meta?.avatarUrl || "/images/avatars/technology-partner.png"}
                                        alt={advisor.name}
                                        className="w-7 h-7 rounded-full object-cover"
                                    />
                                    <span className="flex-1 text-left text-sm text-neutral-700">{advisor.name}</span>
                                    {isSelected && <Check className="w-4 h-4 text-amber-600" />}
                                </button>
                            );
                        })}
                        {selected.length > 0 && (
                            <button
                                onClick={() => { selected.forEach((id) => onToggle(id)); }}
                                className="w-full mt-1 px-3 py-2 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
                            >
                                Clear selection (use auto-select)
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// ============================================
// ADVISOR RESPONSE CARD (Drill-down)
// ============================================

function AdvisorResponseCard({ response }: { response: AdvisorResponse }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const meta = ADVISOR_META[response.advisorId];

    return (
        <div className={`border rounded-xl overflow-hidden transition-all ${meta?.borderColor || "border-neutral-200"}`}>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${
                    isExpanded ? meta?.bgColor || "bg-neutral-50" : ""
                }`}
            >
                <img
                    src={meta?.avatarUrl || "/images/avatars/technology-partner.png"}
                    alt={response.advisorName}
                    className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1">
                    <span className="font-medium text-sm text-neutral-800">{response.advisorName}</span>
                    <span className="ml-2 text-xs text-neutral-400">
            {(response.relevanceScore * 100).toFixed(0)}% relevant
          </span>
                </div>
                {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-neutral-400" />
                ) : (
                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                )}
            </button>
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-neutral-100">
                    <div className="chat-message-content prose prose-sm max-w-none mt-3 text-neutral-700 prose-neutral prose-pre:bg-neutral-800 prose-pre:text-neutral-100">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{response.response}</ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
}

// ============================================
// MAIN ROUND TABLE CONTENT
// ============================================

function RoundTableContent() {
    const router = useRouter();
    const [messages, setMessages] = useState<RoundTableMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [loadingPhase, setLoadingPhase] = useState<string>("");
    const [selectedAdvisors, setSelectedAdvisors] = useState<string[]>([]);
    const [usage, setUsage] = useState<UsageInfo | null>(null);
    const [isPaidUser, setIsPaidUser] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Check tier and usage on mount
    useEffect(() => {
        async function checkUsage() {
            try {
                const res = await fetch("/api/usage");
                if (res.ok) {
                    const data = await res.json();
                    setUsage(data.usage);
                    const tier = data.usage?.tier;
                    setIsPaidUser(tier === "power" || tier === "pro" || tier === "team");
                }
            } catch {
                setIsPaidUser(false);
            }
        }
        checkUsage();
    }, []);

    const refreshUsage = useCallback(async () => {
        try {
            const res = await fetch("/api/usage");
            if (res.ok) {
                const data = await res.json();
                setUsage(data.usage);
            }
        } catch { /* silent */ }
    }, []);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loadingPhase]);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = "auto";
            inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
        }
    }, [input]);

    const toggleAdvisor = useCallback((id: string) => {
        setSelectedAdvisors((prev) =>
            prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
        );
    }, []);

    function parseRTEvents(text: string) {
        const events: Array<{ type: string; [key: string]: unknown }> = [];
        const regex = /__RT_EVENT__([\s\S]*?)__RT_END__/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            try { events.push(JSON.parse(match[1])); } catch { /* skip */ }
        }
        return { events };
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleNewConversation = () => {
        setMessages([]);
        setError(null);
        setInput("");
        inputRef.current?.focus();
    };

    async function handleSubmit(e?: React.FormEvent) {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;
        if (usage && !usage.canSendMessage) {
            setShowUpgradeModal(true);
            return;
        }

        setError(null);

        const userMessage: RoundTableMessage = {
            id: `msg-${Date.now()}`,
            role: "user",
            content: input.trim(),
            createdAt: new Date(),
        };

        const currentMessages = [...messages, userMessage];
        setMessages(currentMessages);
        setInput("");
        setIsLoading(true);
        setLoadingPhase("Selecting advisors...");

        try {
            const apiMessages = currentMessages.map((m) => ({ role: m.role, content: m.content }));

            const res = await fetch("/api/chat/roundtable", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: apiMessages,
                    selectedAdvisors: selectedAdvisors.length > 0 ? selectedAdvisors : undefined,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                if (errorData.upgradeRequired) { setShowUpgradeModal(true); return; }
                throw new Error(errorData.error || "Failed to get response");
            }

            const reader = res.body?.getReader();
            if (!reader) throw new Error("No reader available");

            const decoder = new TextDecoder();
            let buffer = "";
            let synthesis = "";
            const advisorResponses: AdvisorResponse[] = [];
            const advisorsConsulted: AdvisorInfo[] = [];
            let messagesCharged = 0;

            const assistantId = `msg-${Date.now() + 1}`;
            setMessages((prev) => [...prev, {
                id: assistantId, role: "assistant", content: "", advisorResponses: [], createdAt: new Date(),
            }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const { events } = parseRTEvents(buffer);
                buffer = "";

                for (const event of events) {
                    switch (event.type) {
                        case "advisor_start":
                            if (event.content && !event.advisorId) {
                                try {
                                    const parsed = JSON.parse(event.content as string);
                                    advisorsConsulted.splice(0, advisorsConsulted.length, ...parsed);
                                    const names = advisorsConsulted.map((a: AdvisorInfo) => a.name).join(", ");
                                    setLoadingPhase(`Consulting: ${names}...`);
                                } catch {}
                            } else if (event.advisorId) {
                                setLoadingPhase(`Getting input from ${event.advisorName}...`);
                            }
                            break;
                        case "advisor_complete":
                            advisorResponses.push({
                                advisorId: event.advisorId as string,
                                advisorName: event.advisorName as string,
                                response: event.content as string,
                                tokensUsed: event.tokensUsed as number,
                                relevanceScore: event.relevanceScore as number,
                            });
                            setMessages((prev) => prev.map((m) =>
                                m.id === assistantId ? { ...m, advisorResponses: [...advisorResponses] } : m
                            ));
                            break;
                        case "synthesis_start":
                            setLoadingPhase("Synthesizing recommendations...");
                            break;
                        case "synthesis_chunk":
                            synthesis += event.content as string;
                            setMessages((prev) => prev.map((m) =>
                                m.id === assistantId ? { ...m, content: synthesis, advisorsConsulted, advisorResponses: [...advisorResponses] } : m
                            ));
                            break;
                        case "synthesis_complete":
                            try { const meta = JSON.parse(event.content as string); messagesCharged = meta.messagesCharged; } catch {}
                            setMessages((prev) => prev.map((m) =>
                                m.id === assistantId ? { ...m, content: synthesis, advisorsConsulted, advisorResponses: [...advisorResponses], messagesCharged } : m
                            ));
                            break;
                        case "error":
                            setError((event.error as string) || "An error occurred");
                            break;
                    }
                }
            }

            await refreshUsage();
        } catch (err) {
            console.error("[RoundTable] Error:", err);
            setError(err instanceof Error ? err.message : "Failed to get response. Please try again.");
            setMessages((prev) => prev.filter((m) => m.role === "user" || m.content !== ""));
        } finally {
            setIsLoading(false);
            setLoadingPhase("");
        }
    }

    const isInputDisabled = isLoading || (usage !== null && !usage.canSendMessage);

    // Paywall screen
    if (isPaidUser === false) {
        return (
            <div className="h-screen flex items-center justify-center p-8">
                <div className="max-w-md text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Crown className="w-8 h-8 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-neutral-900 mb-3">Round Table is a Premium Feature</h1>
                    <p className="text-neutral-600 mb-6">
                        Get multi-perspective guidance from your entire virtual C-suite. Available on PowerUser, Pro, and Team plans.
                    </p>
                    <Button onClick={() => router.push("/pricing")}>View Plans</Button>
                </div>
            </div>
        );
    }

    if (isPaidUser === null) {
        return (
            <div className="h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 border-b border-neutral-200 bg-white px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <MessagesSquare className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-neutral-900">Round Table</h1>
                            <p className="text-sm text-neutral-500">Your virtual C-suite boardroom</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {usage && (
                            <div className="hidden sm:block">
                                <UsageMeter compact showUpgrade={false} />
                            </div>
                        )}
                        {messages.length > 0 && (
                            <Button variant="outline" size="sm" onClick={handleNewConversation} className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                New Discussion
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center p-6">
                        <div className="max-w-lg text-center">
                            <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <MessagesSquare className="w-10 h-10 text-amber-600" />
                            </div>
                            <h2 className="text-xl font-semibold text-neutral-800 mb-3">Welcome to the Round Table</h2>
                            <p className="text-neutral-500 mb-8">
                                Ask any business question and get synthesized perspectives from your virtual C-suite.
                                The most relevant advisors will automatically weigh in, or you can choose specific ones.
                            </p>
                            <div className="flex items-center justify-center gap-3 mb-8">
                                {Object.entries(ADVISOR_META).map(([id, meta]) => {
                                    return (
                                        <div key={id} className="flex flex-col items-center gap-1" title={meta.name}>
                                            <img
                                                src={meta.avatarUrl}
                                                alt={meta.name}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                                            />
                                            <span className="text-[10px] text-neutral-400 max-w-[60px] text-center leading-tight">
                        {meta.name.split(" ")[0]}
                      </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                                {suggestedPrompts.map((example) => (
                                    <button key={example} onClick={() => setInput(example)}
                                            className="p-3 rounded-xl border border-neutral-200 text-sm text-neutral-600 hover:border-amber-300 hover:bg-amber-50 transition-colors text-left">
                                        &ldquo;{example}&rdquo;
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto px-6 py-6 space-y-6">
                        {messages.map((message) => (
                            <div key={message.id}>
                                {message.role === "user" ? (
                                    <div className="flex justify-end">
                                        <div className="bg-primary-red text-white px-4 py-3 rounded-2xl rounded-br-md max-w-[80%]">
                                            <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {message.advisorsConsulted && message.advisorsConsulted.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {message.advisorsConsulted.map((advisor: AdvisorInfo) => {
                                                    const meta = ADVISOR_META[advisor.id];
                                                    return (
                                                        <span key={advisor.id} title={advisor.reason}
                                                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${meta?.bgColor || "bg-neutral-50"} ${meta?.color || "text-neutral-600"}`}>
                              <img
                                  src={meta?.avatarUrl || "/images/avatars/technology-partner.png"}
                                  alt={advisor.name}
                                  className="w-4 h-4 rounded-full object-cover"
                              />
                                                            {advisor.name}
                            </span>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        <div className="bg-neutral-100 text-neutral-900 px-5 py-4 rounded-2xl rounded-bl-md">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Sparkles className="w-4 h-4 text-amber-500" />
                                                <span className="text-xs font-medium text-amber-600 uppercase tracking-wide">Round Table Synthesis</span>
                                            </div>
                                            {message.content ? (
                                                <div className="chat-message-content prose prose-sm max-w-none prose-neutral prose-pre:bg-neutral-800 prose-pre:text-neutral-100">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-neutral-500">
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    <span>Thinking...</span>
                                                </div>
                                            )}
                                            {message.messagesCharged && message.messagesCharged > 0 && (
                                                <div className="mt-3 pt-3 border-t border-neutral-200">
                                                    <span className="text-xs text-neutral-400">{message.messagesCharged} messages used</span>
                                                </div>
                                            )}
                                        </div>

                                        {message.advisorResponses && message.advisorResponses.length > 0 && (
                                            <div className="space-y-2 ml-2">
                                                <p className="text-xs font-medium text-neutral-400 uppercase tracking-wide px-1">Individual Advisor Perspectives</p>
                                                {message.advisorResponses.map((resp) => (
                                                    <AdvisorResponseCard key={resp.advisorId} response={resp} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex items-center gap-3 px-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                                </div>
                                <span className="text-sm text-amber-600">{loadingPhase}</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Error */}
            {error && (
                <div className="px-6 pb-2">
                    <div className="max-w-3xl mx-auto p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                </div>
            )}

            {/* Limit Warning */}
            {usage && usage.status === "exceeded" && (
                <div className="px-6 pb-2">
                    <div className="max-w-3xl mx-auto p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <div className="flex items-start gap-3">
                            <Zap className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="font-medium text-amber-800">Message limit reached</p>
                                <p className="text-sm text-amber-700 mt-1">You&apos;ve used all {usage.totalAvailable} messages this month.</p>
                            </div>
                            <Button size="sm" onClick={() => setShowUpgradeModal(true)}>Upgrade</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Input */}
            <div className="flex-shrink-0 border-t border-neutral-200 bg-white p-4">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center gap-3 mb-3">
                        <AdvisorSelector selected={selectedAdvisors} onToggle={toggleAdvisor} disabled={isLoading} />
                        {selectedAdvisors.length > 0 && (
                            <div className="flex gap-1">
                                {selectedAdvisors.map((id) => {
                                    const meta = ADVISOR_META[id];
                                    return (
                                        <img
                                            key={id}
                                            src={meta?.avatarUrl || "/images/avatars/technology-partner.png"}
                                            alt={meta?.name || id}
                                            title={meta?.name || id}
                                            className="w-7 h-7 rounded-full object-cover border border-neutral-200"
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="relative">
            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                      placeholder={usage && !usage.canSendMessage ? "Message limit reached — upgrade to continue" : "Ask your virtual C-suite anything..."}
                      rows={1} disabled={isInputDisabled}
                      className="w-full resize-none rounded-xl border border-neutral-200 pl-4 pr-14 py-3 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 disabled:opacity-50 disabled:cursor-not-allowed" />
                        <Button type="submit" size="icon" disabled={!input.trim() || isInputDisabled}
                                className="absolute right-2 bottom-2 h-9 w-9 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </form>
                    <p className="text-xs text-neutral-400 text-center mt-2">
                        Round Table consults multiple advisors per question. Each response uses multiple messages from your plan.
                    </p>
                </div>
            </div>

            {usage && (
                <UpgradeModal
                    isOpen={showUpgradeModal}
                    onClose={() => setShowUpgradeModal(false)}
                    currentTier={usage.tier}
                    messagesUsed={usage.messagesUsed}
                    messagesLimit={usage.totalAvailable}
                />
            )}
        </div>
    );
}

// ============================================
// SKELETON & PAGE EXPORT
// ============================================

function RoundTableSkeleton() {
    return (
        <div className="h-screen flex flex-col">
            <div className="flex-shrink-0 border-b border-neutral-200 bg-white px-6 py-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 animate-pulse" />
                    <div>
                        <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse" />
                        <div className="h-4 w-48 bg-neutral-200 rounded animate-pulse mt-1" />
                    </div>
                </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        </div>
    );
}

export default function RoundTablePage() {
    return (
        <Suspense fallback={<RoundTableSkeleton />}>
            <RoundTableContent />
        </Suspense>
    );
}