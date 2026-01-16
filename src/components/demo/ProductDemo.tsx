"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Settings,
  Sparkles,
  CheckCircle2,
  Send,
  ChevronDown,
  Building2,
  User,
  MessageSquare,
} from "lucide-react";
import { AgentAvatar } from "@/components/ui/agent-avatar";

// Screen duration in milliseconds
const SCREEN_DURATION = 6000;

// Demo screens configuration
const screens = [
  { id: "dashboard", title: "Your AI Advisory Board" },
  { id: "settings-intro", title: "Personalize Your Experience" },
  { id: "settings-form", title: "Add Your Business Context" },
  { id: "chat-start", title: "Start a Conversation" },
  { id: "chat-response", title: "Get Personalized Advice" },
  { id: "agent-switch", title: "Switch Between Experts" },
  { id: "legal-response", title: "Specialized Guidance" },
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
            {/* Dashboard Screen */}
            {currentScreen === 0 && <DashboardScreen />}

            {/* Settings Intro Screen */}
            {currentScreen === 1 && <SettingsIntroScreen />}

            {/* Settings Form Screen */}
            {currentScreen === 2 && <SettingsFormScreen />}

            {/* Chat Start Screen */}
            {currentScreen === 3 && <ChatStartScreen />}

            {/* Chat Response Screen */}
            {currentScreen === 4 && <ChatResponseScreen />}

            {/* Agent Switch Screen */}
            {currentScreen === 5 && <AgentSwitchScreen />}

            {/* Legal Response Screen */}
            {currentScreen === 6 && <LegalResponseScreen />}
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
          Click anywhere to pause • Click dots to jump to a section
        </p>
      </div>
  );
}

// ============ Individual Screen Components ============

function DashboardScreen() {
  const agents = [
    { id: "technology", name: "Technology Partner", subtitle: "Virtual CTO/CIO" },
    { id: "coach", name: "Executive Coach", subtitle: "Leadership Partner" },
    { id: "legal", name: "Legal Advisor", subtitle: "Contract & Compliance" },
    { id: "hr", name: "HR Partner", subtitle: "People Operations" },
    { id: "knowledge", name: "Knowledge Base", subtitle: "Company AI" },
    { id: "content", name: "Content Engine", subtitle: "Thought Leadership" },
  ];

  return (
      <div className="h-full bg-neutral-50 p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Welcome back, Shannon</h1>
            <p className="text-neutral-500">Your AI advisory board is ready</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-neutral-100 rounded-lg">
              <Settings className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </div>

        {/* Agent Grid */}
        <div className="grid grid-cols-3 gap-4">
          {agents.map((agent, index) => (
              <div
                  key={agent.name}
                  className="bg-white rounded-xl p-4 border border-neutral-200 hover:shadow-md transition-all cursor-pointer animate-fade-up"
                  style={{ animationDelay: `${index * 100}ms` }}
              >
                <AgentAvatar agentId={agent.id} size="lg" className="mb-3 shadow-md" />
                <h3 className="font-semibold text-neutral-900">{agent.name}</h3>
                <p className="text-sm text-neutral-500">{agent.subtitle}</p>
              </div>
          ))}
        </div>
      </div>
  );
}

function SettingsIntroScreen() {
  return (
      <div className="h-full bg-neutral-50 p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-neutral-600" />
          <h1 className="text-xl font-bold text-neutral-900">Settings</h1>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 max-w-lg">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary-red-light flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-red" />
            </div>
            <div>
              <h2 className="font-semibold text-neutral-900 mb-1">Personalize Your Experience</h2>
              <p className="text-sm text-neutral-500">
                Tell us about your business so we can provide more relevant advice
              </p>
            </div>
          </div>

          <div className="space-y-4 animate-fade-up" style={{ animationDelay: "200ms" }}>
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
              <Building2 className="w-5 h-5 text-neutral-400" />
              <span className="text-neutral-600">Company Information</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
              <User className="w-5 h-5 text-neutral-400" />
              <span className="text-neutral-600">Your Role & Goals</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-neutral-400" />
              <span className="text-neutral-600">Communication Preferences</span>
            </div>
          </div>
        </div>
      </div>
  );
}

function SettingsFormScreen() {
  return (
      <div className="h-full bg-neutral-50 p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-neutral-600" />
          <h1 className="text-xl font-bold text-neutral-900">Business Profile</h1>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 max-w-lg">
          <div className="space-y-4">
            <div className="animate-fade-up">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Company Name</label>
              <div className="px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-900">
                Full Stack Data Solutions
              </div>
            </div>

            <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Industry</label>
              <div className="px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-900">
                Data Engineering & Analytics Consulting
              </div>
            </div>

            <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Target Customers</label>
              <div className="px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-900">
                Higher Education, Construction, Mid-Market Enterprises
              </div>
            </div>

            <div className="animate-fade-up" style={{ animationDelay: "300ms" }}>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Average Deal Size</label>
              <div className="px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-900">
                $500,000+
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}

function ChatStartScreen() {
  return (
      <div className="h-full bg-white flex flex-col animate-fade-in">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <AgentAvatar agentId="technology" size="md" />
            <div>
              <h1 className="font-semibold text-neutral-900">Technology Partner</h1>
              <p className="text-sm text-neutral-500">Virtual CTO/CIO</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center animate-fade-up">
            <AgentAvatar agentId="technology" size="lg" className="mx-auto mb-4 w-16 h-16" />
            <h2 className="font-semibold text-neutral-900 mb-2">How can I help you today?</h2>
            <p className="text-sm text-neutral-500 max-w-xs">
              I can help with technology strategy, vendor selection, and digital transformation
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-neutral-200">
          <div className="relative">
            <div className="w-full px-4 py-3 pr-12 border border-neutral-200 rounded-xl text-sm text-neutral-900 bg-neutral-50 animate-typing overflow-hidden whitespace-nowrap">
              What tech investments should I make this year?
            </div>
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary-red rounded-lg flex items-center justify-center">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
  );
}

function ChatResponseScreen() {
  return (
      <div className="h-full bg-white flex flex-col animate-fade-in">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <AgentAvatar agentId="technology" size="md" />
            <div>
              <h1 className="font-semibold text-neutral-900">Technology Partner</h1>
              <p className="text-sm text-neutral-500">Virtual CTO/CIO</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
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
              <p className="text-sm text-neutral-900 mb-3">
                Based on <span className="font-semibold text-primary-red">Full Stack Data Solutions&apos;</span> focus on Higher Ed and Construction, here are my recommendations:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-primary-red font-bold">1.</span>
                  <span><strong>Data Pipeline Automation</strong> - Critical for your $500K+ enterprise contracts</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary-red font-bold">2.</span>
                  <span><strong>Cloud Cost Optimization</strong> - Given your AWS and Snowflake stack</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary-red font-bold">3.</span>
                  <span><strong>AI/ML Integration</strong> - Differentiate your analytics offerings</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-neutral-200">
          <div className="relative">
            <input
                type="text"
                placeholder="Message Technology Partner..."
                className="w-full px-4 py-3 pr-12 border border-neutral-200 rounded-xl text-sm"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary-red rounded-lg flex items-center justify-center">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
  );
}

function AgentSwitchScreen() {
  const agents = [
    { id: "technology", name: "Technology Partner", subtitle: "Virtual CTO/CIO", selected: true },
    { id: "coach", name: "Executive Coach", subtitle: "Leadership Partner" },
    { id: "legal", name: "Legal Advisor", subtitle: "Contract & Compliance" },
    { id: "hr", name: "HR Partner", subtitle: "People Operations" },
  ];

  return (
      <div className="h-full bg-white flex flex-col animate-fade-in">
        {/* Chat Header with Dropdown */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <AgentAvatar agentId="technology" size="md" />
            <div className="flex items-center gap-2">
              <div>
                <h1 className="font-semibold text-neutral-900">Technology Partner</h1>
                <p className="text-sm text-neutral-500">Virtual CTO/CIO</p>
              </div>
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </div>
          </div>
        </div>

        {/* Agent Dropdown */}
        <div className="relative px-6">
          <div className="absolute top-0 left-6 right-6 bg-white rounded-xl border border-neutral-200 shadow-lg z-10 py-2 animate-scale-in">
            {agents.map((agent, index) => (
                <div
                    key={agent.name}
                    className={`flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 cursor-pointer animate-fade-up ${
                        agent.selected ? "bg-neutral-50" : ""
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                  <AgentAvatar agentId={agent.id} size="md" />
                  <div className="flex-1">
                    <div className="font-medium text-neutral-900">{agent.name}</div>
                    <div className="text-xs text-neutral-500">{agent.subtitle}</div>
                  </div>
                  {agent.selected && <CheckCircle2 className="w-5 h-5 text-primary-red" />}
                </div>
            ))}
          </div>
        </div>

        {/* Chat Content (dimmed) */}
        <div className="flex-1 p-6 opacity-30">
          <div className="flex justify-end mb-4">
            <div className="bg-primary-red text-white px-4 py-2 rounded-2xl max-w-xs text-sm">
              What tech investments should I make this year?
            </div>
          </div>
        </div>
      </div>
  );
}

function LegalResponseScreen() {
  return (
      <div className="h-full bg-white flex flex-col animate-fade-in">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <AgentAvatar agentId="legal" size="md" />
            <div>
              <h1 className="font-semibold text-neutral-900">Legal Advisor</h1>
              <p className="text-sm text-neutral-500">Contract & Compliance</p>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {/* User Message */}
          <div className="flex justify-end animate-fade-up">
            <div className="bg-primary-red text-white px-4 py-2 rounded-2xl max-w-xs text-sm">
              What should I include in my terms of service?
            </div>
          </div>

          {/* AI Response */}
          <div className="flex gap-3 animate-fade-up" style={{ animationDelay: "200ms" }}>
            <AgentAvatar agentId="legal" size="sm" className="flex-shrink-0" />
            <div className="bg-neutral-100 rounded-2xl px-4 py-3 max-w-sm">
              <p className="text-sm text-neutral-900 mb-3">
                For <span className="font-semibold text-primary-red">your consulting business</span> serving Higher Ed and Construction with high-value contracts:
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Core Contract Structure</strong></p>
                <div className="pl-3 border-l-2 border-blue-700 space-y-1 text-neutral-700">
                  <p>• <strong>Service Definition</strong>: Define data engineering & analytics scope</p>
                  <p>• <strong>Payment Terms</strong>: Milestone-based for $500K+ contracts</p>
                  <p>• <strong>IP Rights</strong>: Specify deliverable ownership</p>
                  <p>• <strong>Liability Caps</strong>: Industry standard limits</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-neutral-200">
          <div className="relative">
            <input
                type="text"
                placeholder="Message Legal Advisor..."
                className="w-full px-4 py-3 pr-12 border border-neutral-200 rounded-xl text-sm"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary-red rounded-lg flex items-center justify-center">
              <Send className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
  );
}