"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Sparkles,
  Send,
  MessageSquare,
  FileText,
  FolderOpen,
  PenTool,
  Target,
  MessagesSquare,
  Upload,
  Search,
  Check,
} from "lucide-react";
import { AgentAvatar, AgentAvatarGroup } from "@/components/ui/agent-avatar";

// Screen duration in milliseconds
const SCREEN_DURATION = 6000;

// Demo screens configuration
const screens = [
  { id: "dashboard", title: "Your Business Toolkit" },
  { id: "advisor-chat", title: "Get Expert Advice Instantly" },
  { id: "content-engine", title: "Create Content with AI" },
  { id: "documents", title: "Generate Professional Documents" },
  { id: "company-library", title: "Build Your Knowledge Base" },
  { id: "goals", title: "Set Goals & Track Progress" },
  { id: "roundtable", title: "Multi-Advisor Collaboration" },
];

export default function ProductDemo() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);

  const nextScreen = useCallback(() => {
    setCurrentScreen((prev) => (prev + 1) % screens.length);
    setProgress(0);
  }, []);

  // Auto-advance screens
  useEffect(() => {
    if (!isPlaying) return;

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextScreen();
          return 0;
        }
        return prev + (100 / (SCREEN_DURATION / 50));
      });
    }, 50);

    return () => clearInterval(progressInterval);
  }, [isPlaying, nextScreen]);

  const goToScreen = (index: number) => {
    setCurrentScreen(index);
    setProgress(0);
  };

  return (
      <div className="w-full max-w-4xl mx-auto">
        {/* Demo Container */}
        <div className="relative bg-neutral-100 rounded-2xl overflow-hidden shadow-2xl">
          {/* Demo Screen */}
          <div className="aspect-[16/10] relative overflow-hidden">
            {currentScreen === 0 && <DashboardScreen />}
            {currentScreen === 1 && <AdvisorChatScreen />}
            {currentScreen === 2 && <ContentEngineScreen />}
            {currentScreen === 3 && <DocumentsScreen />}
            {currentScreen === 4 && <CompanyLibraryScreen />}
            {currentScreen === 5 && <GoalsScreen />}
            {currentScreen === 6 && <RoundTableScreen />}
          </div>

          {/* Controls Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="flex items-center gap-4">
              {/* Play/Pause Button */}
              <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                )}
              </button>

              {/* Progress Dots */}
              <div className="flex-1 flex items-center gap-2">
                {screens.map((screen, index) => (
                    <button
                        key={screen.id}
                        onClick={() => goToScreen(index)}
                        className="group flex-1 h-1.5 rounded-full bg-white/20 overflow-hidden"
                    >
                      <div
                          className={`h-full rounded-full transition-all duration-100 ${
                              index < currentScreen
                                  ? "bg-white w-full"
                                  : index === currentScreen
                                      ? "bg-white"
                                      : "bg-transparent w-0"
                          }`}
                          style={{
                            width: index === currentScreen ? `${progress}%` : index < currentScreen ? "100%" : "0%",
                          }}
                      />
                    </button>
                ))}
              </div>

              {/* Screen Title */}
              <div className="text-white text-sm font-medium">
                {screens[currentScreen].title}
              </div>
            </div>
          </div>
        </div>

        {/* Caption */}
        <p className="text-center text-neutral-500 text-sm mt-4">
          Click anywhere to pause &bull; Click dots to jump to a section
        </p>
      </div>
  );
}

// ============ Individual Screen Components ============

function DashboardScreen() {
  const tools = [
    { icon: MessageSquare, name: "AI Advisors", subtitle: "Expert guidance on demand", color: "bg-primary-red/10", iconColor: "text-primary-red" },
    { icon: FileText, name: "Templates", subtitle: "Professional documents", color: "bg-accent-teal/10", iconColor: "text-accent-teal" },
    { icon: FolderOpen, name: "Company Library", subtitle: "Your knowledge base", color: "bg-blue-100", iconColor: "text-blue-600" },
    { icon: PenTool, name: "Content Engine", subtitle: "AI-powered writing", color: "bg-purple-100", iconColor: "text-purple-600" },
    { icon: Target, name: "Goals", subtitle: "Track your progress", color: "bg-green-100", iconColor: "text-green-600" },
    { icon: MessagesSquare, name: "Round Table", subtitle: "Multi-advisor sessions", color: "bg-amber-100", iconColor: "text-amber-600" },
  ];

  return (
      <div className="h-full bg-neutral-50 p-5 animate-fade-in">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-neutral-900">Welcome back, Shannon</h1>
          <p className="text-sm text-neutral-500">Your AI-powered business toolkit</p>
        </div>

        {/* Tool Grid */}
        <div className="grid grid-cols-3 gap-3">
          {tools.map((tool, index) => (
              <div
                  key={tool.name}
                  className="bg-white rounded-xl p-4 border border-neutral-200 hover:shadow-md transition-all cursor-pointer animate-fade-up"
                  style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className={`w-10 h-10 rounded-lg ${tool.color} flex items-center justify-center mb-2.5`}>
                  <tool.icon className={`w-5 h-5 ${tool.iconColor}`} aria-hidden="true" />
                </div>
                <h3 className="font-semibold text-neutral-900 text-sm">{tool.name}</h3>
                <p className="text-xs text-neutral-500">{tool.subtitle}</p>
              </div>
          ))}
        </div>
      </div>
  );
}

function AdvisorChatScreen() {
  return (
      <div className="h-full bg-white flex flex-col animate-fade-in">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <AgentAvatar agentId="technology" size="md" />
            <div>
              <h1 className="font-semibold text-neutral-900 text-sm">Technology Partner</h1>
              <p className="text-xs text-neutral-500">Virtual CTO/CIO</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-auto p-5 space-y-3">
          {/* User Message */}
          <div className="flex justify-end animate-fade-up">
            <div className="bg-primary-red text-white px-4 py-2 rounded-2xl max-w-xs text-sm">
              What tech investments should I make this year?
            </div>
          </div>

          {/* AI Response */}
          <div className="flex gap-3 animate-fade-up" style={{ animationDelay: "200ms" }}>
            <AgentAvatar agentId="technology" size="sm" className="flex-shrink-0" />
            <div className="bg-neutral-100 rounded-2xl px-4 py-3 max-w-sm">
              <p className="text-sm text-neutral-900 mb-2">
                Based on <span className="font-semibold text-primary-red">Full Stack Data Solutions&apos;</span> focus, here are my recommendations:
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-primary-red font-bold">1.</span>
                  <span><strong>Data Pipeline Automation</strong> — Critical for enterprise contracts</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary-red font-bold">2.</span>
                  <span><strong>Cloud Cost Optimization</strong> — Given your AWS stack</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary-red font-bold">3.</span>
                  <span><strong>AI/ML Integration</strong> — Differentiate your offerings</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="px-5 py-3 border-t border-neutral-200">
          <div className="relative">
            <input
                type="text"
                placeholder="Message Technology Partner..."
                className="w-full px-4 py-2.5 pr-12 border border-neutral-200 rounded-xl text-sm"
                readOnly
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary-red rounded-lg flex items-center justify-center">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
  );
}

function ContentEngineScreen() {
  return (
      <div className="h-full bg-white flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-3 border-b border-neutral-200">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <PenTool className="w-4 h-4 text-purple-600" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-semibold text-neutral-900 text-sm">Content Engine</h1>
            <p className="text-xs text-neutral-500">AI-powered content creation</p>
          </div>
        </div>

        <div className="flex-1 p-5 space-y-4">
          {/* Type selector pills */}
          <div className="flex gap-2 animate-fade-up">
            <span className="px-3 py-1.5 bg-purple-600 text-white rounded-full text-xs font-medium">LinkedIn Post</span>
            <span className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">Blog</span>
            <span className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">Article</span>
            <span className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">Newsletter</span>
          </div>

          {/* Topic field */}
          <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Topic</label>
            <div className="px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-sm text-neutral-900 animate-typing overflow-hidden whitespace-nowrap">
              AI trends reshaping data engineering in 2026
            </div>
          </div>

          {/* Preview card — styled like a LinkedIn post */}
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 animate-fade-up" style={{ animationDelay: "250ms" }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-neutral-300" />
              <div>
                <p className="text-sm font-semibold text-neutral-900">Shannon McGill</p>
                <p className="text-xs text-neutral-500">Founder, Full Stack Data Solutions</p>
              </div>
            </div>
            <div className="text-sm text-neutral-700 space-y-2">
              <p>The data engineering landscape is shifting fast. Here are 3 trends every leader should watch:</p>
              <p className="text-neutral-600">📊 Real-time pipelines are replacing batch processing...</p>
            </div>
            <div className="mt-3 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" aria-hidden="true" />
              <span className="text-xs font-medium text-purple-600">AI Generated</span>
            </div>
          </div>
        </div>
      </div>
  );
}

function DocumentsScreen() {
  const templates = [
    { name: "Business Plan", format: "DOCX", formatColor: "bg-blue-100 text-blue-700", status: "ready" },
    { name: "Pitch Deck", format: "PPTX", formatColor: "bg-orange-100 text-orange-700", status: "generating" },
    { name: "Project Proposal", format: "DOCX", formatColor: "bg-blue-100 text-blue-700", status: "ready" },
  ];

  return (
      <div className="h-full bg-white flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-3 border-b border-neutral-200">
          <div className="w-8 h-8 rounded-lg bg-accent-teal/10 flex items-center justify-center">
            <FileText className="w-4 h-4 text-accent-teal" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-semibold text-neutral-900 text-sm">Document Templates</h1>
            <p className="text-xs text-neutral-500">Generate professional business documents</p>
          </div>
        </div>

        <div className="flex-1 p-5 space-y-4">
          {/* Category filter pills */}
          <div className="flex gap-2 animate-fade-up">
            <span className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">All</span>
            <span className="px-3 py-1.5 bg-accent-teal text-white rounded-full text-xs font-medium">Business</span>
            <span className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">Finance</span>
            <span className="px-3 py-1.5 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">HR</span>
          </div>

          {/* Template cards */}
          <div className="space-y-3">
            {templates.map((template, index) => (
                <div
                    key={template.name}
                    className={`flex items-center gap-4 p-3.5 rounded-xl border animate-fade-up ${
                        template.status === "generating"
                            ? "border-accent-teal bg-accent-teal/5"
                            : "border-neutral-200 bg-white"
                    }`}
                    style={{ animationDelay: `${100 + index * 100}ms` }}
                >
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-neutral-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900">{template.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${template.formatColor}`}>
                        {template.format}
                      </span>
                      {template.status === "generating" ? (
                          <span className="text-xs text-accent-teal font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-teal animate-pulse" />
                            Generating...
                          </span>
                      ) : (
                          <span className="text-xs text-neutral-500">Ready to customize</span>
                      )}
                    </div>
                  </div>
                  <button className="px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors">
                    {template.status === "generating" ? "View" : "Generate"}
                  </button>
                </div>
            ))}
          </div>
        </div>
      </div>
  );
}

function CompanyLibraryScreen() {
  const documents = [
    { name: "Q4-Financial-Report.pdf", status: "Ready", statusColor: "bg-green-100 text-green-700", size: "2.3 MB" },
    { name: "Employee-Handbook.docx", status: "Ready", statusColor: "bg-green-100 text-green-700", size: "1.1 MB" },
    { name: "Marketing-Strategy.pdf", status: "Processing", statusColor: "bg-yellow-100 text-yellow-700", size: "4.7 MB" },
  ];

  return (
      <div className="h-full bg-white flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-3 border-b border-neutral-200">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <FolderOpen className="w-4 h-4 text-blue-600" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-semibold text-neutral-900 text-sm">Company Library</h1>
            <p className="text-xs text-neutral-500">Your business knowledge base</p>
          </div>
        </div>

        <div className="flex-1 p-5 space-y-4">
          {/* Search bar */}
          <div className="relative animate-fade-up">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" aria-hidden="true" />
            <input
                type="text"
                placeholder="Search your documents..."
                className="w-full pl-9 pr-4 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50"
                readOnly
            />
          </div>

          {/* Upload zone */}
          <div className="border-2 border-dashed border-neutral-300 rounded-xl p-3 flex items-center justify-center gap-2 text-neutral-500 animate-fade-up" style={{ animationDelay: "80ms" }}>
            <Upload className="w-4 h-4" aria-hidden="true" />
            <span className="text-xs font-medium">Drop files here or click to upload</span>
          </div>

          {/* Document rows */}
          <div className="space-y-2">
            {documents.map((doc, index) => (
                <div
                    key={doc.name}
                    className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 bg-white animate-fade-up"
                    style={{ animationDelay: `${160 + index * 80}ms` }}
                >
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-neutral-400" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{doc.name}</p>
                    <p className="text-xs text-neutral-500">{doc.size}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${doc.statusColor}`}>
                    {doc.status}
                  </span>
                </div>
            ))}
          </div>
        </div>
      </div>
  );
}

function GoalsScreen() {
  const steps = [
    { text: "Research competitor pricing models", done: true },
    { text: "Launch outbound email campaign to 500 leads", done: true },
    { text: "Onboard 3 new enterprise clients", done: true },
    { text: "Upsell existing accounts to annual contracts", done: false },
    { text: "Hit $650K quarterly revenue target", done: false },
  ];

  return (
      <div className="h-full bg-white flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-3 border-b border-neutral-200">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
            <Target className="w-4 h-4 text-green-600" aria-hidden="true" />
          </div>
          <div>
            <h1 className="font-semibold text-neutral-900 text-sm">Goals &amp; Action Plans</h1>
            <p className="text-xs text-neutral-500">Track progress toward your objectives</p>
          </div>
        </div>

        <div className="flex-1 p-5 space-y-4">
          {/* Goal card */}
          <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4 animate-fade-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-neutral-900">Increase Q2 Revenue by 30%</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">Revenue</span>
                  <span className="text-xs text-neutral-500">Due Jun 30, 2026</span>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-neutral-500">Progress</span>
                <span className="font-semibold text-green-600">60%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: "60%" }} />
              </div>
            </div>
          </div>

          {/* Action steps */}
          <div className="space-y-2">
            {steps.map((step, index) => (
                <div
                    key={index}
                    className="flex items-center gap-3 animate-fade-up"
                    style={{ animationDelay: `${100 + index * 70}ms` }}
                >
                  {step.done ? (
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-white" aria-hidden="true" />
                      </div>
                  ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-neutral-300 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${step.done ? "text-neutral-500 line-through" : "text-neutral-900"}`}>
                    {step.text}
                  </span>
                </div>
            ))}
          </div>
        </div>
      </div>
  );
}

function RoundTableScreen() {
  const perspectives = [
    { agentId: "marketing", name: "Marketing Partner", snippet: "Focus on content marketing to drive inbound leads...", color: "border-l-pink-500" },
    { agentId: "sales", name: "Sales Partner", snippet: "Prioritize outbound to high-value accounts first...", color: "border-l-orange-500" },
    { agentId: "coach", name: "Executive Coach", snippet: "Align the team around shared revenue OKRs...", color: "border-l-purple-500" },
  ];

  return (
      <div className="h-full bg-white flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-3 border-b border-neutral-200">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <MessagesSquare className="w-4 h-4 text-amber-600" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h1 className="font-semibold text-neutral-900 text-sm">Round Table</h1>
            <p className="text-xs text-neutral-500">Multi-advisor collaboration</p>
          </div>
          <AgentAvatarGroup agentIds={["marketing", "sales", "coach"]} size="xs" />
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-3">
          {/* User Message */}
          <div className="flex justify-end animate-fade-up">
            <div className="bg-primary-red text-white px-4 py-2 rounded-2xl max-w-xs text-sm">
              How should we approach growing revenue next quarter?
            </div>
          </div>

          {/* Synthesis card */}
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-3.5 animate-fade-up" style={{ animationDelay: "150ms" }}>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-600" aria-hidden="true" />
              <span className="text-xs font-semibold text-amber-700">Combined Insight</span>
            </div>
            <p className="text-sm text-neutral-700">
              All advisors recommend a dual approach: invest in content marketing for long-term inbound growth while running targeted outbound for quick wins.
            </p>
          </div>

          {/* Individual advisor perspectives */}
          {perspectives.map((advisor, index) => (
              <div
                  key={advisor.agentId}
                  className={`flex items-start gap-3 p-3 rounded-lg bg-neutral-50 border-l-4 ${advisor.color} animate-fade-up`}
                  style={{ animationDelay: `${250 + index * 80}ms` }}
              >
                <AgentAvatar agentId={advisor.agentId} size="xs" className="flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-neutral-900">{advisor.name}</p>
                  <p className="text-xs text-neutral-600 mt-0.5">{advisor.snippet}</p>
                </div>
              </div>
          ))}
        </div>
      </div>
  );
}
