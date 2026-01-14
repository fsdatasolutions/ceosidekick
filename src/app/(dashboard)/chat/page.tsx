"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Send,
  Cpu,
  Target,
  Scale,
  Users,
  BookOpen,
  PenTool,
  TrendingUp,
  DollarSign,
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
    icon: Cpu,
    color: "bg-accent-teal",
    description: "Technology strategy, build vs. buy, vendor evaluation, digital transformation",
  },
  coach: {
    name: "Executive Coach",
    subtitle: "Leadership Partner",
    icon: Target,
    color: "bg-agent-coach",
    description: "Leadership development, decision frameworks, strategic thinking",
  },
  legal: {
    name: "Legal Advisor",
    subtitle: "Contract & Compliance",
    icon: Scale,
    color: "bg-agent-legal",
    description: "Contract review, terms of service, compliance guidance",
  },
  hr: {
    name: "HR Partner",
    subtitle: "People Operations",
    icon: Users,
    color: "bg-agent-hr",
    description: "Job descriptions, hiring, performance reviews, policies",
  },
  marketing: {
    name: "Marketing Partner",
    subtitle: "Growth & Brand",
    icon: TrendingUp,
    color: "bg-pink-600",
    description: "Marketing strategy, brand development, campaigns, analytics",
  },
  sales: {
    name: "Sales Partner",
    subtitle: "Revenue & Deals",
    icon: DollarSign,
    color: "bg-orange-600",
    description: "Sales process, pipeline management, objection handling, pricing",
  },
  knowledge: {
    name: "Knowledge Base",
    subtitle: "Company AI",
    icon: BookOpen,
    color: "bg-agent-knowledge",
    description: "Ask questions about your uploaded documents",
  },
  content: {
    name: "Content Engine",
    subtitle: "Thought Leadership",
    icon: PenTool,
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
// Adds blank lines before bold text that starts a line (AI often uses **text** as headers)
function formatMarkdown(content: string): string {
  // Split into lines
  const lines = content.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prevLine = i > 0 ? lines[i - 1] : '';

    // If this line starts with bold text and previous line is not empty
    // and previous line is not a header/list, add a blank line before
    if (
        line.match(/^\*\*[^*]+\*\*/) && // Line starts with **text**
        prevLine.trim() !== '' && // Previous line is not empty
        !prevLine.match(/^#{1,6}\s/) && // Previous is not a header
        !prevLine.match(/^[-*]\s/) && // Previous is not a list item
        !prevLine.match(/^\d+\.\s/) // Previous is not a numbered list
    ) {
      result.push(''); // Add blank line for separation
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
  const AgentIcon = currentAgent.icon;

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

  // Scroll to bottom when messages change
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

  // Load conversation history if ID provided
  useEffect(() => {
    if (conversationIdParam) {
      loadConversation(conversationIdParam);
    }
  }, [conversationIdParam]);

  // Load chat history when sidebar opens
  useEffect(() => {
    if (showHistory) {
      loadChatHistory();
    }
  }, [showHistory, agent]);

  async function loadChatHistory() {
    setLoadingHistory(true);
    try {
      const response = await fetch(`/api/conversations?agent=${agent}`);
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function loadConversation(id: string) {
    try {
      const response = await fetch(`/api/chat?conversationId=${id}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(
            data.messages.map((m: { id: string; role: string; content: string; createdAt: string }) => ({
              ...m,
              createdAt: new Date(m.createdAt),
            }))
        );
      }
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageContent = input.trim();
    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now() + 1}`;

    const userMsg: Message = {
      id: userMessageId,
      role: "user",
      content: messageContent,
      createdAt: new Date(),
    };

    const assistantMsg: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      createdAt: new Date(),
    };

    // Capture existing messages to avoid closure issues
    const existingMessages = [...messages];
    const allMessages = [...existingMessages, userMsg, assistantMsg];

    setMessages(allMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageContent,
          conversationId,
          agent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "conversation_id") {
                setConversationId(data.id);
                window.history.replaceState({}, "", `/chat?agent=${agent}&id=${data.id}`);
              } else if (data.type === "content") {
                fullContent += data.content;
                // Create fresh array with updated content
                setMessages([
                  ...existingMessages,
                  userMsg,
                  { ...assistantMsg, content: fullContent },
                ]);
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
      setMessages(existingMessages); // Restore previous state
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function startNewConversation() {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setShowHistory(false);
    window.history.replaceState({}, "", `/chat?agent=${agent}`);
  }

  function switchAgent(newAgent: AgentType) {
    if (newAgent === agent) {
      setShowAgentSelector(false);
      return;
    }

    // If there's an active conversation, confirm before switching
    if (messages.length > 0) {
      if (!confirm("Switch agent? This will start a new conversation.")) {
        setShowAgentSelector(false);
        return;
      }
    }

    setAgent(newAgent);
    setMessages([]);
    setConversationId(null);
    setError(null);
    setShowAgentSelector(false);
    setShowHistory(false);
    window.history.replaceState({}, "", `/chat?agent=${newAgent}`);
  }

  function selectConversation(conv: Conversation) {
    setConversationId(conv.id);
    setAgent(conv.agent);
    setShowHistory(false);
    window.history.replaceState({}, "", `/chat?agent=${conv.agent}&id=${conv.id}`);
    loadConversation(conv.id);
  }

  async function deleteConversation(convId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this conversation?")) return;

    try {
      const response = await fetch(`/api/conversations/${convId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setConversations(conversations.filter(c => c.id !== convId));
        if (conversationId === convId) {
          startNewConversation();
        }
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  }

  async function handlePromptClick(prompt: string) {
    if (isLoading) return;

    console.log("[PromptClick] Starting with prompt:", prompt.slice(0, 50));

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now() + 1}`;

    const userMsg: Message = {
      id: userMessageId,
      role: "user",
      content: prompt,
      createdAt: new Date(),
    };

    const assistantMsg: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      createdAt: new Date(),
    };

    // Keep track of all messages including new ones
    const existingMessages = [...messages];
    const allMessages = [...existingMessages, userMsg, assistantMsg];

    setMessages(allMessages);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          conversationId,
          agent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "conversation_id") {
                setConversationId(data.id);
                window.history.replaceState({}, "", `/chat?agent=${agent}&id=${data.id}`);
              } else if (data.type === "content") {
                fullContent += data.content;
                // Create fresh array with updated content
                setMessages([
                  ...existingMessages,
                  userMsg,
                  { ...assistantMsg, content: fullContent },
                ]);
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch (parseErr) {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
      setMessages(existingMessages); // Restore previous state
    } finally {
      setIsLoading(false);
    }
  }

  return (
      <div className="h-screen flex">
        {/* History Sidebar */}
        {showHistory && (
            <div className="w-80 border-r border-neutral-200 bg-white flex flex-col flex-shrink-0">
              <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
                <h2 className="font-semibold text-neutral-900">Chat History</h2>
                <button
                    onClick={() => setShowHistory(false)}
                    className="p-1 hover:bg-neutral-100 rounded"
                >
                  <ChevronLeft className="w-5 h-5 text-neutral-500" />
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
                    <div className="p-2 space-y-1">
                      {conversations.map((conv) => (
                          <button
                              key={conv.id}
                              onClick={() => selectConversation(conv)}
                              className={`w-full text-left p-3 rounded-lg hover:bg-neutral-50 transition-colors group ${
                                  conversationId === conv.id ? "bg-neutral-100" : ""
                              }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-neutral-900 truncate text-sm">
                                  {conv.title || "Untitled conversation"}
                                </p>
                                <p className="text-xs text-neutral-500 mt-1">
                                  {new Date(conv.lastMessageAt).toLocaleDateString()} · {conv.messageCount} messages
                                </p>
                              </div>
                              <button
                                  onClick={(e) => deleteConversation(conv.id, e)}
                                  className="p-1 opacity-0 group-hover:opacity-100 hover:bg-neutral-200 rounded transition-opacity"
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
        )}

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex-shrink-0 border-b border-neutral-200 bg-white px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={`p-2 rounded-lg transition-colors ${
                        showHistory ? "bg-neutral-100" : "hover:bg-neutral-100"
                    }`}
                    title="Chat History"
                >
                  <History className="w-5 h-5 text-neutral-600" />
                </button>

                {/* Agent Selector */}
                <div className="relative" ref={agentSelectorRef}>
                  <button
                      onClick={() => setShowAgentSelector(!showAgentSelector)}
                      className="flex items-center gap-3 p-2 -m-2 rounded-xl hover:bg-neutral-50 transition-colors"
                  >
                    <div
                        className={`w-12 h-12 rounded-xl ${currentAgent.color} flex items-center justify-center`}
                    >
                      <AgentIcon className="w-6 h-6 text-white" />
                    </div>
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
                          const AgentItemIcon = agentInfo.icon;
                          const isSelected = agentKey === agent;

                          return (
                              <button
                                  key={agentKey}
                                  onClick={() => switchAgent(agentKey)}
                                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors ${
                                      isSelected ? "bg-neutral-50" : ""
                                  }`}
                              >
                                <div
                                    className={`w-10 h-10 rounded-lg ${agentInfo.color} flex items-center justify-center flex-shrink-0`}
                                >
                                  <AgentItemIcon className="w-5 h-5 text-white" />
                                </div>
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
                  <div
                      className={`w-16 h-16 rounded-2xl ${currentAgent.color} flex items-center justify-center mb-6`}
                  >
                    <AgentIcon className="w-8 h-8 text-white" />
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
                            <div
                                className={`w-8 h-8 rounded-lg ${currentAgent.color} flex items-center justify-center flex-shrink-0`}
                            >
                              <AgentIcon className="w-4 h-4 text-white" />
                            </div>
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
        </div> {/* End Main Chat Area */}
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