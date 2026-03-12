"use client";

import { MessageSquare, Sparkles, TrendingUp } from "lucide-react";
import { AgentAvatar } from "@/components/ui/agent-avatar";

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Tell Us About Your Business",
    description:
        "Set up your business profile in minutes. CEO Sidekick learns your industry, goals, and challenges to personalize every tool in the suite.",
    color: "bg-primary-red",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "Pick the Right Tool",
    description:
        "Need strategic advice? Chat with an AI advisor. Creating content? Fire up the Content Engine. Drafting a contract? Use Templates. Every tool is purpose-built for a specific business need.",
    color: "bg-accent-gold",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Grow Your Business",
    description:
        "Set goals, track progress, build your company knowledge base, and keep iterating. CEO Sidekick grows with you as your business evolves.",
    color: "bg-accent-teal",
  },
];

export function HowItWorks() {
  return (
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-primary-red font-semibold text-sm uppercase tracking-wide mb-3">
              Simple Process
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              How CEO Sidekick works
            </h2>
            <p className="text-lg text-neutral-600">
              From setup to results in minutes.
              No complex onboarding, no learning curve.
            </p>
          </div>

          {/* Steps */}
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-24 left-1/2 w-2/3 h-0.5 bg-neutral-200 -translate-x-1/2" aria-hidden="true" />

            <div className="grid md:grid-cols-3 gap-12 lg:gap-8">
              {steps.map((step, index) => (
                  <div key={index} className="relative text-center">
                    {/* Step Number */}
                    <div className="relative inline-block mb-6">
                      <div className={`w-20 h-20 rounded-2xl ${step.color} flex items-center justify-center shadow-lg relative z-10`}>
                        <step.icon className="w-8 h-8 text-white" aria-hidden="true" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white border-2 border-neutral-200 flex items-center justify-center text-sm font-bold text-neutral-900 z-20" aria-hidden="true">
                        {step.number}
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="font-display text-xl font-bold text-neutral-900 mb-3">
                      {step.title}
                    </h3>
                    <p className="text-neutral-600 leading-relaxed max-w-sm mx-auto">
                      {step.description}
                    </p>
                  </div>
              ))}
            </div>
          </div>

          {/* Visual Demo */}
          <div className="mt-20 bg-neutral-900 rounded-3xl p-8 lg:p-12 overflow-hidden relative">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5" aria-hidden="true">
              <div className="absolute top-0 left-0 w-96 h-96 bg-primary-red rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-teal rounded-full blur-3xl" />
            </div>

            <div className="relative grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div>
                <h3 className="font-display text-2xl lg:text-3xl font-bold text-white mb-4">
                  Built for how you actually work
                </h3>
                <p className="text-neutral-400 text-lg mb-6 leading-relaxed">
                  Every tool in CEO Sidekick understands your business context. Your company profile,
                  uploaded documents, and conversation history inform every response — whether you&apos;re
                  chatting with an advisor, generating content, or building a template.
                </p>
                <div className="space-y-4">
                  {[
                    "Context-aware across all tools, not just chat",
                    "Documents and templates tailored to your business",
                    "AI-generated action plans you can actually execute",
                    "Everything connected through your Company Library",
                  ].map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-accent-gold flex items-center justify-center flex-shrink-0" aria-hidden="true">
                          <svg
                              className="w-3 h-3 text-neutral-900"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                          >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={3}
                                d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <span className="text-neutral-300">{item}</span>
                      </div>
                  ))}
                </div>
              </div>

              {/* Right Content - Chat Example */}
              <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                <div className="space-y-4">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="bg-primary-red text-white px-4 py-3 rounded-xl rounded-br-sm max-w-xs">
                      <p className="text-sm">
                        I need to hire my first developer. What should I look for?
                      </p>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex gap-3">
                    <AgentAvatar agentId="hr" size="sm" className="flex-shrink-0" />
                    <div className="bg-white/10 px-4 py-3 rounded-xl rounded-bl-sm text-white max-w-sm">
                      <p className="text-sm mb-3">
                        Great question! Before I give recommendations, let me understand your context:
                      </p>
                      <div className="space-y-2 text-sm text-neutral-300">
                        <p>1. What will they primarily build?</p>
                        <p>2. Remote, hybrid, or in-office?</p>
                        <p>3. What&apos;s your budget range?</p>
                      </div>
                    </div>
                  </div>

                  {/* User Follow-up */}
                  <div className="flex justify-end">
                    <div className="bg-primary-red text-white px-4 py-3 rounded-xl rounded-br-sm max-w-xs">
                      <p className="text-sm">
                        Web app, remote, $80-120k
                      </p>
                    </div>
                  </div>

                  {/* AI Final Response Preview */}
                  <div className="flex gap-3">
                    <AgentAvatar agentId="hr" size="sm" className="flex-shrink-0" />
                    <div className="bg-white/10 px-4 py-3 rounded-xl rounded-bl-sm text-white max-w-sm">
                      <p className="text-sm">
                        Perfect. For a mid-level full-stack role at that budget, here&apos;s what to prioritize...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
  );
}