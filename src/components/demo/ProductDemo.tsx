"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Cpu,
  Target,
  Scale,
  Users,
  BookOpen,
  PenTool,
  Settings,
  Sparkles,
  CheckCircle2,
  Send,
  ChevronDown,
  Building2,
  User,
  MessageSquare,
} from "lucide-react";

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
    { name: "Strategy Partner", subtitle: "Virtual CTO/CIO", icon: Cpu, color: "bg-accent-teal" },
    { name: "Executive Coach", subtitle: "Leadership Partner", icon: Target, color: "bg-purple-600" },
    { name: "Legal Advisor", subtitle: "Contract & Compliance", icon: Scale, color: "bg-blue-700" },
    { name: "HR Partner", subtitle: "People Operations", icon: Users, color: "bg-emerald-600" },
    { name: "Knowledge Base", subtitle: "Company AI", icon: BookOpen, color: "bg-indigo-500" },
    { name: "Content Engine", subtitle: "Thought Leadership", icon: PenTool, color: "bg-primary-red" },
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
            <div className={`w-12 h-12 rounded-xl ${agent.color} flex items-center justify-center mb-3`}>
              <agent.icon className="w-6 h-6 text-white" />
            </div>
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

      {/* AI Personalization Banner */}
      <div className="mb-6 p-5 bg-gradient-to-r from-primary-red/10 to-amber-500/10 border border-primary-red/20 rounded-xl animate-scale-in">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary-red/10 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-primary-red" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-neutral-900 mb-1">Personalize Your AI Advisors</h3>
            <p className="text-sm text-neutral-600 mb-3">
              Fill out your business context to get tailored advice from all AI advisors.
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-white/50 rounded-full h-2">
                <div className="bg-primary-red h-2 rounded-full w-1/4" />
              </div>
              <span className="text-sm font-medium text-neutral-700">1/4</span>
            </div>
          </div>
          <button className="px-4 py-2 bg-primary-red text-white rounded-lg text-sm font-medium">
            Continue Setup
          </button>
        </div>
      </div>

      {/* Settings Cards */}
      <div className="grid gap-3">
        {[
          { icon: User, title: "Your Profile", desc: "Role, experience, focus areas", complete: true },
          { icon: Building2, title: "Company Profile", desc: "Industry, size, products", complete: false, highlight: true },
          { icon: Target, title: "Business Context", desc: "Challenges, goals, tech stack", complete: false },
          { icon: MessageSquare, title: "AI Preferences", desc: "Communication style", complete: false },
        ].map((item, index) => (
          <div
            key={item.title}
            className={`flex items-center gap-4 p-4 bg-white rounded-xl border transition-all animate-fade-up ${
              item.highlight ? "border-primary-red/30 ring-1 ring-primary-red/20" : "border-neutral-200"
            }`}
            style={{ animationDelay: `${index * 100 + 200}ms` }}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              item.complete ? "bg-emerald-100" : item.highlight ? "bg-primary-red/10" : "bg-neutral-100"
            }`}>
              {item.complete ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <item.icon className={`w-5 h-5 ${item.highlight ? "text-primary-red" : "text-neutral-600"}`} />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-neutral-900">{item.title}</h3>
              <p className="text-sm text-neutral-500">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsFormScreen() {
  return (
    <div className="h-full bg-neutral-50 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <button className="text-neutral-500 hover:text-neutral-700">← Back</button>
        <h1 className="text-xl font-bold text-neutral-900">Company Profile</h1>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="grid gap-4">
          <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Company Name</label>
            <div className="px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-900">
              Full Stack Data Solutions
            </div>
          </div>
          
          <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Industry</label>
            <div className="px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-900">
              Technology / Software
            </div>
          </div>
          
          <div className="animate-fade-up" style={{ animationDelay: "300ms" }}>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Products & Services</label>
            <div className="px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-900 text-sm">
              Data engineering, analytics, cloud architecture consulting for enterprise clients...
            </div>
          </div>
          
          <div className="animate-fade-up" style={{ animationDelay: "400ms" }}>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Target Market</label>
            <div className="px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-900 text-sm">
              Higher Education and Construction industries, $500K+ contracts
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6 animate-fade-up" style={{ animationDelay: "500ms" }}>
          <button className="px-4 py-2 bg-primary-red text-white rounded-lg text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Save & Continue
          </button>
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
          <div className="w-10 h-10 rounded-xl bg-accent-teal flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-neutral-900">Strategy Partner</h1>
            <p className="text-sm text-neutral-500">Virtual CTO/CIO</p>
          </div>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-accent-teal flex items-center justify-center mb-4 animate-scale-in">
          <Cpu className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2 animate-fade-up" style={{ animationDelay: "100ms" }}>
          How can I help you today?
        </h2>
        <p className="text-neutral-500 mb-6 animate-fade-up" style={{ animationDelay: "200ms" }}>
          Technology strategy, build vs. buy, vendor evaluation
        </p>

        {/* Suggested Prompts */}
        <div className="w-full max-w-md space-y-2">
          {[
            "What should I prioritize in my technology roadmap?",
            "Help me evaluate cloud providers for my business",
          ].map((prompt, index) => (
            <div
              key={prompt}
              className="p-3 rounded-xl border border-neutral-200 text-sm text-neutral-700 animate-fade-up cursor-pointer hover:bg-neutral-50"
              style={{ animationDelay: `${300 + index * 100}ms` }}
            >
              {prompt}
            </div>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-neutral-200">
        <div className="relative animate-fade-up" style={{ animationDelay: "500ms" }}>
          <div className="w-full px-4 py-3 pr-12 border border-neutral-200 rounded-xl bg-neutral-50 text-neutral-400 text-sm">
            What tech investments should I make this year?
            <span className="animate-pulse">|</span>
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
          <div className="w-10 h-10 rounded-xl bg-accent-teal flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-neutral-900">Strategy Partner</h1>
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
          <div className="w-8 h-8 rounded-lg bg-accent-teal flex items-center justify-center flex-shrink-0">
            <Cpu className="w-4 h-4 text-white" />
          </div>
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
            placeholder="Message Strategy Partner..."
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
    { name: "Strategy Partner", subtitle: "Virtual CTO/CIO", icon: Cpu, color: "bg-accent-teal", selected: true },
    { name: "Executive Coach", subtitle: "Leadership Partner", icon: Target, color: "bg-purple-600" },
    { name: "Legal Advisor", subtitle: "Contract & Compliance", icon: Scale, color: "bg-blue-700" },
    { name: "HR Partner", subtitle: "People Operations", icon: Users, color: "bg-emerald-600" },
  ];

  return (
    <div className="h-full bg-white flex flex-col animate-fade-in">
      {/* Chat Header with Dropdown */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-teal flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <div>
              <h1 className="font-semibold text-neutral-900">Strategy Partner</h1>
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
              <div className={`w-10 h-10 rounded-lg ${agent.color} flex items-center justify-center`}>
                <agent.icon className="w-5 h-5 text-white" />
              </div>
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
          <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center">
            <Scale className="w-5 h-5 text-white" />
          </div>
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
          <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center flex-shrink-0">
            <Scale className="w-4 h-4 text-white" />
          </div>
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
