"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AgentAvatar } from "@/components/ui/agent-avatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Loader2,
  Plus,
  AlertCircle,
  History,
  MessageSquare,
  ChevronLeft,
  Trash2,
  ChevronDown,
  Check,
} from "lucide-react";

type AgentType = "technology" | "coach" | "legal" | "hr" | "marketing" | "sales" | "knowledge" | "content";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

interface Conversation {
  id: string;
  title: string;
  agent: AgentType;
  lastMessageAt: string;
  messageCount: number;
}

const agents = {
  technology: {
    name: "Technology Partner",
    subtitle: "Virtual CTO/CIO",
    color: "bg-accent-teal",
    description: "Technology strategy, build vs. buy, vendor evaluation, digital transformation",
  },
  coach: {
    name: "Executive Coach",
    subtitle: "Leadership Partner",
    color: "bg-agent-coach",
    description: "Leadership development, decision frameworks, strategic thinking",
  },
  legal: {
    name: "Legal Advisor",
    subtitle: "Contract & Compliance",
    color: "bg-agent-legal",
    description: "Contract review, terms of service, compliance guidance",
  },
  hr: {
    name: "HR Partner",
    subtitle: "People Operations",
    color: "bg-agent-hr",
    description: "Job descriptions, hiring, performance reviews, policies",
  },
  marketing: {
    name: "Marketing Partner",
    subtitle: "Growth & Brand",
    color: "bg-pink-600",
    description: "Marketing strategy, brand development, campaigns, analytics",
  },
  sales: {
    name: "Sales Partner",
    subtitle: "Revenue & Deals",
    color: "bg-orange-600",
    description: "Sales process, pipeline management, objection handling, pricing",
  },
  knowledge: {
    name: "Knowledge Base",
    subtitle: "Company AI",
    color: "bg-agent-knowledge",
    description: "Ask questions about your uploaded documents",
  },
  content: {
    name: "Content Engine",
    subtitle: "Thought Leadership",
    color: "bg-primary-red",
    description: "Blog posts, social media, marketing copy",
  },
};

const suggestedPrompts: Record<AgentType, string[]> = {
  technology: [
    "Should I build a custom solution or buy an existing tool for my CRM needs?",
    "What tech stack would you recommend for a SaaS startup?",
    "Help me evaluate cloud providers for my business",
    "What should I prioritize in my technology roadmap this quarter?",
  ],
  coach: [
    "How do I prepare for a difficult conversation with an underperforming employee?",
    "Help me set better OKRs for my team",
    "What frameworks can help me make better strategic decisions?",
  ],
  legal: [
    "What should I include in my terms of service?",
    "Review this contract for potential issues",
    "What privacy policy requirements apply to my business?",
  ],
  hr: [
    "Help me write a job description for a senior developer",
    "What questions should I ask in a technical interview?",
    "How do I structure a performance review?",
  ],
  marketing: [
    "What marketing channels should I focus on with a $5K monthly budget?",
    "Help me develop a brand positioning statement",
    "How do I measure marketing ROI effectively?",
  ],
  sales: [
    "How do I handle when prospects say we're too expensive?",
    "Help me build a sales process from scratch",
    "What should I include in a winning proposal?",
  ],
  knowledge: [
    "What does my uploaded documentation say about...",
    "Summarize the key points from my documents",
    "Find information about... in my files",
  ],
  content: [
    "Write a blog post about...",
    "Create social media posts for my product launch",
    "Help me craft an email newsletter",
  ],
};

// Preprocess markdown to ensure proper spacing
function formatMarkdown(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prevLine = i > 0 ? lines[i - 1] : '';

    if (
        line.match(/^\*\*[^*]+\*\*/) &&
        prevLine.trim() !== '' &&
        !prevLine.match(/^#{1,6}\s/) &&
        !prevLine.match(/^[-*]\s/) &&
        !prevLine.match(/^\d+\.\s/)
    ) {
      result.push('');
    }

    result.push(line);
  }

  return result.join('\n');
}

function ChatContent() {
  const searchParams = useSearchParams();
  const agentParam = searchParams.get("agent") as AgentType | null;
  const conversationIdParam = searchParams.get("id");

  const [agent, setAgent] = useState<AgentType>(agentParam || "technology");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(
      conversationIdParam
  );
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showAgentSelector, setShowAgentSelector] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const agentSelectorRef = useRef<HTMLDivElement>(null);

  const currentAgent = agents[agent];

  // Close agent selector when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (agentSelectorRef.current && !agentSelectorRef.current.contains(event.target as Node)) {
        setShowAgentSelector(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update URL when agent changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("agent", agent);
    if (conversationId) {
      url.searchParams.set("id", conversationId);
    } else {
      url.searchParams.delete("id");
    }
    window.history.replaceState({}, "", url.toString());
  }, [agent, conversationId]);

  // Load conversation if ID provided
  useEffect(() => {
    if (conversationIdParam) {
      loadConversation(conversationIdParam);
    }
  }, [conversationIdParam]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Fetch conversation history when sidebar opens
  useEffect(() => {
    if (showHistory) {
      fetchConversations();
    }
  }, [showHistory]);

  const fetchConversations = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/conversations?agent=${agent}`);
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (err) {
      console.error("Failed to fetch conversations:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}`);
      if (!res.ok) throw new Error("Failed to load conversation");
      const data = await res.json();

      if (data.conversation) {
        setAgent(data.conversation.agent);
        setMessages(
            data.messages.map((m: Message) => ({  // Changed from data.conversation.messages
              ...m,
              createdAt: new Date(m.createdAt),
            }))
        );
        setConversationId(id);
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
      setError("Failed to load conversation");
    }
  };
  
  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;

    try {
      const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");

      setConversations((prev) => prev.filter((c) => c.id !== id));

      if (id === conversationId) {
        startNewConversation();
      }
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setShowHistory(false);

    const url = new URL(window.location.href);
    url.searchParams.delete("id");
    window.history.replaceState({}, "", url.toString());
  };

  const switchAgent = (newAgent: AgentType) => {
    if (newAgent !== agent) {
      setAgent(newAgent);
      setMessages([]);
      setConversationId(null);
      setError(null);
    }
    setShowAgentSelector(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setError(null);

    const userMsgId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: "user",
        content: userMessage,
        createdAt: new Date(),
      },
    ]);

    const assistantMsgId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        createdAt: new Date(),
      },
    ]);

    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          agent,
          conversationId,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      let fullContent = "";
      let newConversationId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.conversationId) {
                newConversationId = data.conversationId;
              }

              if (data.content) {
                fullContent += data.content;
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === assistantMsgId
                            ? { ...msg, content: fullContent }
                            : msg
                    )
                );
              }

              if (data.error) {
                setError(data.error);
              }
            } catch {
              // Ignore JSON parse errors for incomplete chunks
            }
          }
        }
      }

      if (newConversationId) {
        setConversationId(newConversationId);
      }
    } catch {
      setError("Failed to send message. Please try again.");
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsgId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
      <div className="h-screen flex">
        {/* History Sidebar */}
        <div
            className={`${
                showHistory ? "w-80" : "w-0"
            } transition-all duration-300 overflow-hidden border-r border-neutral-200 bg-white flex flex-col`}
        >
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900">Chat History</h2>
            <button
                onClick={() => setShowHistory(false)}
                className="p-1 hover:bg-neutral-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                </div>
            ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-neutral-500 text-sm">
                  No conversations yet
                </div>
            ) : (
                <div className="divide-y divide-neutral-100">
                  {conversations.map((conv) => (
                      <button
                          key={conv.id}
                          onClick={() => {
                            loadConversation(conv.id);
                            setShowHistory(false);
                          }}
                          className={`w-full p-4 text-left hover:bg-neutral-50 transition-colors group ${
                              conv.id === conversationId ? "bg-neutral-50" : ""
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <AgentAvatar agentId={conv.agent} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-neutral-900 truncate text-sm">
                              {conv.title || "Untitled"}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {conv.messageCount} messages •{" "}
                              {formatRelativeTime(conv.lastMessageAt)}
                            </p>
                          </div>
                          <button
                              onClick={(e) => deleteConversation(conv.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-200 rounded transition-opacity"
                          >
                            <Trash2 className="w-4 h-4 text-neutral-400" />
                          </button>
                        </div>
                      </button>
                  ))}
                </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-neutral-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {!showHistory && (
                    <button
                        onClick={() => setShowHistory(true)}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Chat History"
                    >
                      <History className="w-5 h-5 text-neutral-600" />
                    </button>
                )}

                {/* Agent Selector */}
                <div className="relative" ref={agentSelectorRef}>
                  <button
                      onClick={() => setShowAgentSelector(!showAgentSelector)}
                      className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                  >
                    <AgentAvatar agentId={agent} size="lg" />
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h1 className="font-display text-xl font-semibold text-neutral-900">
                          {currentAgent.name}
                        </h1>
                        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${showAgentSelector ? "rotate-180" : ""}`} />
                      </div>
                      <p className="text-sm text-neutral-500">{currentAgent.subtitle}</p>
                    </div>
                  </button>

                  {/* Agent Dropdown */}
                  {showAgentSelector && (
                      <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl border border-neutral-200 shadow-lg z-50 py-2 max-h-[70vh] overflow-y-auto">
                        {(Object.entries(agents) as [AgentType, typeof agents.technology][]).map(([agentKey, agentInfo]) => {
                          const isSelected = agentKey === agent;

                          return (
                              <button
                                  key={agentKey}
                                  onClick={() => switchAgent(agentKey)}
                                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors ${
                                      isSelected ? "bg-neutral-50" : ""
                                  }`}
                              >
                                <AgentAvatar agentId={agentKey} size="md" />
                                <div className="flex-1 text-left">
                                  <div className="font-medium text-neutral-900">{agentInfo.name}</div>
                                  <div className="text-xs text-neutral-500">{agentInfo.description}</div>
                                </div>
                                {isSelected && (
                                    <Check className="w-5 h-5 text-primary-red flex-shrink-0" />
                                )}
                              </button>
                          );
                        })}
                      </div>
                  )}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={startNewConversation}>
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                  <div className="w-20 h-20 mb-6">
                    <AgentAvatar agentId={agent} size="lg" className="w-20 h-20 rounded-2xl" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-neutral-900 mb-2">
                    How can I help you today?
                  </h2>
                  <p className="text-neutral-600 mb-8">{currentAgent.description}</p>

                  {/* Suggested Prompts */}
                  <div className="w-full grid gap-3">
                    {suggestedPrompts[agent].map((prompt, index) => (
                        <button
                            key={index}
                            onClick={() => handlePromptClick(prompt)}
                            className="text-left p-4 rounded-xl border border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
                        >
                          <p className="text-neutral-700">{prompt}</p>
                        </button>
                    ))}
                  </div>
                </div>
            ) : (
                <div className="max-w-3xl mx-auto space-y-6">
                  {messages.map((message) => (
                      <div
                          key={message.id}
                          className={`flex gap-4 ${
                              message.role === "user" ? "justify-end" : "justify-start"
                          }`}
                      >
                        {message.role === "assistant" && (
                            <AgentAvatar agentId={agent} size="sm" className="flex-shrink-0" />
                        )}
                        <div
                            className={`max-w-[80%] rounded-2xl ${
                                message.role === "user"
                                    ? "bg-primary-red text-white px-4 py-3"
                                    : "bg-neutral-100 text-neutral-900 px-5 py-4"
                            }`}
                        >
                          {message.content ? (
                              message.role === "assistant" ? (
                                  <div className="chat-message-content prose prose-sm max-w-none prose-neutral prose-pre:bg-neutral-800 prose-pre:text-neutral-100">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                      {formatMarkdown(message.content)}
                                    </ReactMarkdown>
                                  </div>
                              ) : (
                                  <div className="whitespace-pre-wrap">{message.content}</div>
                              )
                          ) : (
                              <div className="flex items-center gap-2 text-neutral-500">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Thinking...</span>
                              </div>
                          )}
                        </div>
                      </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
              <div className="px-6 pb-2">
                <div className="max-w-3xl mx-auto p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              </div>
          )}

          {/* Input */}
          <div className="flex-shrink-0 border-t border-neutral-200 bg-white p-4">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSubmit} className="relative">
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${currentAgent.name}...`}
                    rows={1}
                    disabled={isLoading}
                    className="w-full resize-none rounded-xl border border-neutral-200 pl-4 pr-14 py-3 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 bottom-2 h-9 w-9"
                >
                  {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                      <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
              <p className="text-xs text-neutral-400 text-center mt-2">
                {currentAgent.name} may make mistakes. Verify important information.
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}

function ChatSkeleton() {
  return (
      <div className="h-screen flex flex-col">
        <div className="flex-shrink-0 border-b border-neutral-200 bg-white px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-neutral-200 animate-pulse" />
            <div>
              <div className="h-6 w-32 bg-neutral-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse mt-1" />
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
        </div>
      </div>
  );
}

export default function ChatPage() {
  return (
      <Suspense fallback={<ChatSkeleton />}>
        <ChatContent />
      </Suspense>
  );
}