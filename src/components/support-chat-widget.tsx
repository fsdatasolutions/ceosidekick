// src/components/support-chat-widget.tsx
// Persistent support chatbot widget — floating in bottom-right on all pages

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import {
    MessageCircleQuestion,
    ChevronDown,
    Trash2,
    Send,
    Loader2,
    X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";

// ============================================
// Types
// ============================================

interface ChatMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface StoredChat {
    messages: ChatMessage[];
    lastUpdated: string;
}

// ============================================
// Constants
// ============================================

const STORAGE_KEY = "ceo-sidekick-support-chat";
const MAX_STORED_MESSAGES = 50;
const MAX_HISTORY_TO_SEND = 20;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const SUGGESTED_QUESTIONS = [
    "What AI advisors are available?",
    "How do credits work?",
    "How do I use the Content Engine?",
    "What's the Round Table?",
];

// ============================================
// Component
// ============================================

export function SupportChatWidget() {
    const pathname = usePathname();

    // State
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [hasShownPulse, setHasShownPulse] = useState(false);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // ============================================
    // localStorage Persistence
    // ============================================

    // Load messages from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data: StoredChat = JSON.parse(stored);
                const age = Date.now() - new Date(data.lastUpdated).getTime();
                if (age < SEVEN_DAYS_MS && data.messages.length > 0) {
                    setMessages(data.messages.slice(-MAX_STORED_MESSAGES));
                } else {
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
            // Check if pulse was already shown
            if (localStorage.getItem("ceo-sidekick-support-pulse-shown")) {
                setHasShownPulse(true);
            }
        } catch {
            // Silently fail — fresh state is fine
        }
    }, []);

    // Save messages to localStorage on change
    useEffect(() => {
        if (messages.length > 0) {
            try {
                const data: StoredChat = {
                    messages: messages.slice(-MAX_STORED_MESSAGES),
                    lastUpdated: new Date().toISOString(),
                };
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            } catch {
                // Storage full or unavailable
            }
        }
    }, [messages]);

    // Mark pulse as shown
    useEffect(() => {
        if (!hasShownPulse) {
            const timer = setTimeout(() => {
                setHasShownPulse(true);
                try {
                    localStorage.setItem("ceo-sidekick-support-pulse-shown", "true");
                } catch {
                    // Ignore
                }
            }, 6000); // 3 pulse cycles at 2s each
            return () => clearTimeout(timer);
        }
    }, [hasShownPulse]);

    // ============================================
    // Auto-scroll
    // ============================================

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // Focus textarea when panel opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => textareaRef.current?.focus(), 200);
        }
    }, [isOpen]);

    // Escape key to close
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    // ============================================
    // Send Message
    // ============================================

    const sendMessage = async (text: string) => {
        if (!text.trim() || isStreaming) return;

        const userMessage: ChatMessage = {
            id: `user-${Date.now()}`,
            role: "user",
            content: text.trim(),
        };

        const assistantMessage: ChatMessage = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: "",
        };

        setMessages((prev) => [...prev, userMessage, assistantMessage]);
        setInput("");
        setIsStreaming(true);

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }

        try {
            // Build history from existing messages (exclude the empty assistant message)
            const history = messages.slice(-MAX_HISTORY_TO_SEND).map((m) => ({
                role: m.role,
                content: m.content,
            }));

            const response = await fetch("/api/support-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text.trim(),
                    history,
                    currentPage: pathname,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Request failed");
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error("No response stream");

            const decoder = new TextDecoder();
            let accumulatedContent = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split("\n");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            const data = JSON.parse(line.slice(6));

                            if (data.type === "content") {
                                accumulatedContent += data.content;
                                setMessages((prev) =>
                                    prev.map((m) =>
                                        m.id === assistantMessage.id
                                            ? { ...m, content: accumulatedContent }
                                            : m
                                    )
                                );
                            } else if (data.type === "error") {
                                setMessages((prev) =>
                                    prev.map((m) =>
                                        m.id === assistantMessage.id
                                            ? { ...m, content: data.message || "Sorry, something went wrong." }
                                            : m
                                    )
                                );
                            }
                        } catch {
                            // Skip malformed SSE lines
                        }
                    }
                }
            }
        } catch (error) {
            const errorMsg =
                error instanceof Error && error.message.includes("Too many")
                    ? error.message
                    : "Sorry, I'm having trouble right now. Please try again in a moment.";

            setMessages((prev) =>
                prev.map((m) =>
                    m.id === assistantMessage.id
                        ? { ...m, content: errorMsg }
                        : m
                )
            );
        } finally {
            setIsStreaming(false);
        }
    };

    // ============================================
    // Handlers
    // ============================================

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        sendMessage(input);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        // Auto-resize
        const textarea = e.target;
        textarea.style.height = "auto";
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    };

    const handleClearChat = () => {
        setMessages([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {
            // Ignore
        }
    };

    // ============================================
    // Render
    // ============================================

    return (
        <>
            {/* Floating trigger button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    aria-label="Open support chat"
                    className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary-red hover:bg-primary-red-hover text-white shadow-lg shadow-primary-red/20 hover:shadow-xl hover:shadow-primary-red/30 flex items-center justify-center transition-all duration-200 ${
                        !hasShownPulse ? "animate-support-pulse" : ""
                    }`}
                >
                    <MessageCircleQuestion className="w-6 h-6" />
                </button>
            )}

            {/* Chat panel */}
            {isOpen && (
                <div
                    role="dialog"
                    aria-label="Support chat"
                    className="fixed bottom-6 right-6 z-50 w-[380px] h-[min(520px,calc(100vh-3rem))] max-md:w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-neutral-200 flex flex-col overflow-hidden animate-support-open"
                >
                    {/* Header */}
                    <div className="bg-primary-red text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <Image
                                src="/images/logo-icon-white.png"
                                alt=""
                                width={24}
                                height={24}
                                className="w-6 h-6"
                                onError={(e) => {
                                    // Fallback if logo doesn't exist
                                    (e.target as HTMLImageElement).style.display = "none";
                                }}
                            />
                            <span className="font-display font-semibold text-sm">
                                Robin
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            {messages.length > 0 && (
                                <button
                                    onClick={handleClearChat}
                                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                                    title="Clear conversation"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                                title="Minimize"
                            >
                                <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div
                        ref={messagesContainerRef}
                        className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
                    >
                        {messages.length === 0 ? (
                            /* Empty state / welcome */
                            <div className="flex flex-col items-center justify-center h-full text-center px-2">
                                <div className="w-12 h-12 rounded-full bg-primary-red/10 flex items-center justify-center mb-3">
                                    <MessageCircleQuestion className="w-6 h-6 text-primary-red" />
                                </div>
                                <p className="text-sm font-medium text-neutral-900 mb-1">
                                    Hi! I&apos;m Robin, your CEO Sidekick assistant.
                                </p>
                                <p className="text-xs text-neutral-500 mb-4">
                                    Ask me anything about using the platform.
                                </p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {SUGGESTED_QUESTIONS.map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => sendMessage(q)}
                                            disabled={isStreaming}
                                            className="border border-neutral-200 rounded-full px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300 transition-colors disabled:opacity-50"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Message bubbles */
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${
                                        msg.role === "user"
                                            ? "justify-end"
                                            : "justify-start"
                                    }`}
                                >
                                    <div
                                        className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed ${
                                            msg.role === "user"
                                                ? "bg-primary-red text-white rounded-2xl rounded-br-sm"
                                                : "bg-neutral-100 text-neutral-800 rounded-2xl rounded-bl-sm"
                                        }`}
                                    >
                                        {msg.role === "assistant" ? (
                                            msg.content ? (
                                                <div className="prose prose-sm prose-neutral max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_code]:text-xs [&_code]:bg-neutral-200 [&_code]:px-1 [&_code]:rounded">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            ) : (
                                                /* Streaming indicator */
                                                <div className="flex items-center gap-1 py-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0ms]" />
                                                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:150ms]" />
                                                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:300ms]" />
                                                </div>
                                            )
                                        ) : (
                                            <span className="whitespace-pre-wrap">
                                                {msg.content}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <form
                        onSubmit={handleSubmit}
                        className="border-t border-neutral-200 px-3 py-2.5 flex items-end gap-2 flex-shrink-0"
                    >
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={handleTextareaChange}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask a question..."
                            rows={1}
                            disabled={isStreaming}
                            className="flex-1 resize-none border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-red/20 focus:border-primary-red disabled:opacity-50 max-h-[120px]"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isStreaming}
                            className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary-red hover:bg-primary-red-hover text-white flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isStreaming ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
