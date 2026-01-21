"use client";

import { Suspense, useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AgentAvatar } from "@/components/ui/agent-avatar";
import { UsageMeter } from "@/components/ui/usage-meter";
import { UpgradeModal } from "@/components/ui/upgrade-modal";
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
  Zap,
  BookmarkPlus,
  BookmarkCheck,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
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

interface SaveStatus {
  savedToKnowledgeBaseAt: string | null;
  hasUnsavedMessages: boolean;
  unsavedMessageCount: number;
  neverSaved: boolean;
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

  // Usage tracking state
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Save to Knowledge Base state
  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null);
  const [savingToKB, setSavingToKB] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Voice mode state
  const [voiceMode, setVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const agentSelectorRef = useRef<HTMLDivElement>(null);

  const currentAgent = agents[agent];

  // Fetch usage on mount
  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const res = await fetch("/api/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data.usage);
      }
    } catch (err) {
      console.error("Failed to fetch usage:", err);
    }
  };

  // Check if conversation has unsaved messages
  const checkSaveStatus = async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/save-to-knowledge-base`);
      if (res.ok) {
        const data = await res.json();
        setSaveStatus(data);
      }
    } catch (err) {
      console.error("Failed to check save status:", err);
      setSaveStatus(null);
    }
  };

  // Save conversation to Knowledge Base
  const saveToKnowledgeBase = async () => {
    if (!conversationId || savingToKB) return;

    setSavingToKB(true);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/save-to-knowledge-base`, {
        method: "POST",
      });

      if (res.status === 403) {
        setShowUpgradeModal(true);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save to Knowledge Base");
        return;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Refresh save status
      checkSaveStatus(conversationId);
    } catch (err) {
      console.error("Failed to save to KB:", err);
      setError("Failed to save conversation to Knowledge Base");
    } finally {
      setSavingToKB(false);
    }
  };

  // ============================================
  // VOICE MODE FUNCTIONS
  // ============================================

  // Start voice recording
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Create audio blob
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType
        });

        // Transcribe the audio
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      console.log("[Voice] Recording started");
    } catch (err) {
      console.error("[Voice] Failed to start recording:", err);
      setError("Could not access microphone. Please check permissions.");
    }
  }, []);

  // Stop voice recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log("[Voice] Recording stopped");
    }
  }, [isRecording]);

  // Toggle recording
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Transcribe audio using Whisper API
  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Transcription failed');
      }

      const data = await res.json();

      if (data.text) {
        // Set the transcribed text as input and submit
        setInput(data.text);
        // Auto-submit the transcribed text
        setTimeout(() => {
          submitVoiceMessage(data.text);
        }, 100);
      }
    } catch (err) {
      console.error("[Voice] Transcription error:", err);
      setError("Failed to transcribe audio. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  };

  // Submit voice message (with voice mode flag)
  const submitVoiceMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Check usage
    if (usage && !usage.canSendMessage) {
      setShowUpgradeModal(true);
      return;
    }

    const userMessage = text.trim();
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
          voiceMode: true, // Flag for voice mode pricing
        }),
      });

      if (res.status === 403) {
        const errorData = await res.json();
        if (errorData.error === "MESSAGE_LIMIT_REACHED") {
          if (errorData.usage) setUsage(errorData.usage);
          setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsgId));
          setShowUpgradeModal(true);
          setIsLoading(false);
          return;
        }
      }

      if (!res.ok) throw new Error("Failed to send message");

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

              if (data.type === "conversation_id" && data.id) {
                newConversationId = data.id;
              }

              if (data.type === "content" && data.content) {
                fullContent += data.content;
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === assistantMsgId
                            ? { ...msg, content: fullContent }
                            : msg
                    )
                );
              }

              if (data.type === "usage" && data.usage) {
                setUsage(data.usage);
              }

              if (data.type === "done") {
                // Synthesize speech for the response if audio is enabled
                if (audioEnabled && fullContent) {
                  synthesizeAndPlay(fullContent);
                }
              }
            } catch {}
          }
        }
      }

      if (newConversationId && !conversationId) {
        setConversationId(newConversationId);
      }
    } catch (err) {
      console.error("Voice message error:", err);
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsgId));
      setError("Failed to send voice message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Synthesize text to speech and play it
  const synthesizeAndPlay = async (text: string) => {
    if (!text.trim()) return;

    setIsSpeaking(true);

    try {
      const res = await fetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, agent }),
      });

      if (!res.ok) {
        throw new Error('Speech synthesis failed');
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        console.error("[Voice] Audio playback error");
      };

      await audio.play();
    } catch (err) {
      console.error("[Voice] Synthesis error:", err);
      setIsSpeaking(false);
    }
  };

  // Stop audio playback
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsSpeaking(false);
    }
  }, []);

  // Toggle voice mode
  const toggleVoiceMode = useCallback(() => {
    setVoiceMode(prev => !prev);
    // Stop any ongoing recording when disabling voice mode
    if (voiceMode && isRecording) {
      stopRecording();
    }
  }, [voiceMode, isRecording, stopRecording]);

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

  // Check save status when conversation changes or messages update
  useEffect(() => {
    if (conversationId && messages.length > 0) {
      checkSaveStatus(conversationId);
    } else {
      setSaveStatus(null);
    }
  }, [conversationId, messages.length]);

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
            data.messages.map((m: Message) => ({
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
    setSaveStatus(null);
    setSaveSuccess(false);

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

    // Check if user can send messages
    if (usage && !usage.canSendMessage) {
      setShowUpgradeModal(true);
      return;
    }

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

      // Handle message limit reached (403)
      if (res.status === 403) {
        const errorData = await res.json();
        if (errorData.error === "MESSAGE_LIMIT_REACHED") {
          // Update usage from response
          if (errorData.usage) {
            setUsage(errorData.usage);
          }
          // Remove the empty assistant message
          setMessages((prev) => prev.filter((msg) => msg.id !== assistantMsgId));
          // Show upgrade modal
          setShowUpgradeModal(true);
          setIsLoading(false);
          return;
        }
      }

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

              // Handle conversation ID
              if (data.type === "conversation_id" && data.id) {
                newConversationId = data.id;
              }

              // Handle content chunks
              if (data.type === "content" && data.content) {
                fullContent += data.content;
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === assistantMsgId
                            ? { ...msg, content: fullContent }
                            : msg
                    )
                );
              }

              // Handle usage update from stream
              if (data.type === "usage" && data.usage) {
                setUsage(data.usage);
              }

              // Handle errors
              if (data.type === "error" && data.error) {
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

  // Check if input should be disabled
  const isInputDisabled = isLoading || (usage !== null && !usage.canSendMessage);

  return (
      <div className="h-screen flex">
        {/* Upgrade Modal */}
        {usage && (
            <UpgradeModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                currentTier={usage.tier}
                messagesUsed={usage.messagesUsed}
                messagesLimit={usage.totalAvailable}
            />
        )}

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
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-neutral-600" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-neutral-400" />
                </div>
            ) : conversations.length > 0 ? (
                <div className="divide-y divide-neutral-100">
                  {conversations.map((conv) => (
                      <div
                          key={conv.id}
                          onClick={() => {
                            loadConversation(conv.id);
                            setShowHistory(false);
                          }}
                          className={`p-4 cursor-pointer hover:bg-neutral-50 transition-colors group ${
                              conv.id === conversationId ? "bg-neutral-50" : ""
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <MessageSquare className="w-4 h-4 text-neutral-400 mt-1" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">
                              {conv.title || "Untitled"}
                            </p>
                            <p className="text-xs text-neutral-500 mt-1">
                              {formatRelativeTime(conv.lastMessageAt)} • {conv.messageCount} messages
                            </p>
                          </div>
                          <button
                              onClick={(e) => deleteConversation(conv.id, e)}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-200 rounded transition-all"
                          >
                            <Trash2 className="w-4 h-4 text-neutral-400" />
                          </button>
                        </div>
                      </div>
                  ))}
                </div>
            ) : (
                <div className="p-8 text-center">
                  <MessageSquare className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">No conversations yet</p>
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

              <div className="flex items-center gap-3">
                {/* Usage Indicator */}
                {usage && (
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                          usage.status === "exceeded" ? "bg-red-500" :
                              usage.status === "critical" ? "bg-orange-500" :
                                  usage.status === "warning" ? "bg-yellow-500" :
                                      "bg-green-500"
                      }`} />
                      <span className="text-sm text-neutral-600">
                      {usage.remaining} left
                    </span>
                      {(usage.status === "warning" || usage.status === "critical" || usage.status === "exceeded") && (
                          <button
                              onClick={() => setShowUpgradeModal(true)}
                              className="text-xs text-primary-red hover:underline flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3" />
                            Upgrade
                          </button>
                      )}
                    </div>
                )}

                {/* Save to Knowledge Base Button */}
                {conversationId && messages.length > 0 && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={saveToKnowledgeBase}
                        disabled={savingToKB || (saveStatus !== null && !saveStatus.hasUnsavedMessages)}
                        className={`${
                            saveSuccess
                                ? "border-green-500 text-green-600"
                                : saveStatus && !saveStatus.hasUnsavedMessages
                                    ? "border-green-500 text-green-600"
                                    : ""
                        }`}
                        title={
                          saveStatus?.neverSaved
                              ? "Save conversation to Knowledge Base"
                              : saveStatus?.hasUnsavedMessages
                                  ? `${saveStatus.unsavedMessageCount} new messages to save`
                                  : "Conversation saved to Knowledge Base"
                        }
                    >
                      {savingToKB ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                      ) : saveSuccess ? (
                          <>
                            <BookmarkCheck className="w-4 h-4" />
                            Saved!
                          </>
                      ) : saveStatus && !saveStatus.hasUnsavedMessages ? (
                          <>
                            <BookmarkCheck className="w-4 h-4" />
                            Saved
                          </>
                      ) : saveStatus?.hasUnsavedMessages && !saveStatus?.neverSaved ? (
                          <>
                            <BookmarkPlus className="w-4 h-4" />
                            Update ({saveStatus.unsavedMessageCount})
                          </>
                      ) : (
                          <>
                            <BookmarkPlus className="w-4 h-4" />
                            Save to KB
                          </>
                      )}
                    </Button>
                )}

                {/* Voice Mode Toggle */}
                <Button
                    variant={voiceMode ? "default" : "outline"}
                    size="sm"
                    onClick={toggleVoiceMode}
                    className={voiceMode ? "bg-primary-red hover:bg-primary-red/90" : ""}
                    title={voiceMode ? "Voice mode ON (3x message cost)" : "Enable voice mode"}
                >
                  {voiceMode ? (
                      <>
                        <Volume2 className="w-4 h-4" />
                        Voice ON
                      </>
                  ) : (
                      <>
                        <VolumeX className="w-4 h-4" />
                        Voice
                      </>
                  )}
                </Button>

                <Button variant="outline" size="sm" onClick={startNewConversation}>
                  <Plus className="w-4 h-4" />
                  New Chat
                </Button>
              </div>
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

          {/* Message Limit Warning */}
          {usage && usage.status === "exceeded" && (
              <div className="px-6 pb-2">
                <div className="max-w-3xl mx-auto p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-amber-800">Message limit reached</p>
                      <p className="text-sm text-amber-700 mt-1">
                        You&apos;ve used all {usage.totalAvailable} messages this month.
                      </p>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => setShowUpgradeModal(true)}
                    >
                      Upgrade
                    </Button>
                  </div>
                </div>
              </div>
          )}

          {/* Input */}
          <div className="flex-shrink-0 border-t border-neutral-200 bg-white p-4">
            <div className="max-w-3xl mx-auto">
              {/* Voice Mode Indicator */}
              {voiceMode && (
                  <div className="flex items-center justify-center gap-2 mb-3 text-sm">
                    {isRecording ? (
                        <div className="flex items-center gap-2 text-red-600 animate-pulse">
                          <Radio className="w-4 h-4" />
                          <span>Recording... Click mic to stop</span>
                        </div>
                    ) : isTranscribing ? (
                        <div className="flex items-center gap-2 text-amber-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Transcribing...</span>
                        </div>
                    ) : isSpeaking ? (
                        <div className="flex items-center gap-2 text-primary-red">
                          <Volume2 className="w-4 h-4 animate-pulse" />
                          <span>Speaking...</span>
                          <button
                              onClick={stopAudio}
                              className="text-xs underline hover:no-underline"
                          >
                            Stop
                          </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-neutral-500">
                          <Mic className="w-4 h-4" />
                          <span>Voice mode active (3x message cost)</span>
                          <button
                              onClick={() => setAudioEnabled(!audioEnabled)}
                              className="text-xs underline hover:no-underline"
                          >
                            {audioEnabled ? "Mute responses" : "Unmute responses"}
                          </button>
                        </div>
                    )}
                  </div>
              )}

              <form onSubmit={handleSubmit} className="relative">
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      usage && !usage.canSendMessage
                          ? "Message limit reached — upgrade to continue"
                          : isRecording
                              ? "Recording..."
                              : isTranscribing
                                  ? "Transcribing..."
                                  : voiceMode
                                      ? `Click mic to speak, or type a message...`
                                      : `Message ${currentAgent.name}...`
                    }
                    rows={1}
                    disabled={isInputDisabled || isRecording || isTranscribing}
                    className={`w-full resize-none rounded-xl border border-neutral-200 pl-4 py-3 focus:outline-none focus:border-primary-red focus:ring-1 focus:ring-primary-red disabled:opacity-50 disabled:cursor-not-allowed ${
                        voiceMode ? "pr-24" : "pr-14"
                    }`}
                />

                {/* Voice Recording Button (only in voice mode) */}
                {voiceMode && (
                    <Button
                        type="button"
                        size="icon"
                        variant={isRecording ? "default" : "outline"}
                        onClick={toggleRecording}
                        disabled={isLoading || isTranscribing || (usage !== null && !usage.canSendMessage)}
                        className={`absolute right-12 bottom-2 h-9 w-9 ${
                            isRecording
                                ? "bg-red-500 hover:bg-red-600 animate-pulse"
                                : ""
                        }`}
                        title={isRecording ? "Stop recording" : "Start recording"}
                    >
                      {isRecording ? (
                          <MicOff className="w-4 h-4" />
                      ) : (
                          <Mic className="w-4 h-4" />
                      )}
                    </Button>
                )}

                {/* Send Button */}
                <Button
                    type="submit"
                    size="icon"
                    disabled={!input.trim() || isInputDisabled || isRecording || isTranscribing}
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
                {voiceMode
                    ? `Voice messages cost 3x. ${currentAgent.name} will speak responses.`
                    : `${currentAgent.name} may make mistakes. Verify important information.`
                }
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