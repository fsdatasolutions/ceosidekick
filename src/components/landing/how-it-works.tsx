"use client";

import { MessageSquare, Sparkles, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Ask Any Business Question",
    description:
      "Type your question in plain English. Whether it's about hiring, technology, legal matters, or strategy — just ask like you would a trusted advisor.",
    color: "bg-primary-red",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "Get Expert-Level Guidance",
    description:
      "Our AI advisors analyze your question using best practices from top consultants, executives, and industry experts. Get actionable advice in seconds.",
    color: "bg-accent-gold",
  },
  {
    number: "03",
    icon: TrendingUp,
    title: "Grow Your Business",
    description:
      "Make confident decisions backed by strategic analysis. Build a knowledge base of your key decisions and continue the conversation as your business evolves.",
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
            Get strategic business guidance in three simple steps. 
            No complex setup, no learning curve.
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-24 left-1/2 w-2/3 h-0.5 bg-neutral-200 -translate-x-1/2" />

          <div className="grid md:grid-cols-3 gap-12 lg:gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative text-center">
                {/* Step Number */}
                <div className="relative inline-block mb-6">
                  <div className={`w-20 h-20 rounded-2xl ${step.color} flex items-center justify-center shadow-lg relative z-10`}>
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white border-2 border-neutral-200 flex items-center justify-center text-sm font-bold text-neutral-900 z-20">
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
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary-red rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-teal rounded-full blur-3xl" />
          </div>

          <div className="relative grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h3 className="font-display text-2xl lg:text-3xl font-bold text-white mb-4">
                Real conversations, real results
              </h3>
              <p className="text-neutral-400 text-lg mb-6 leading-relaxed">
                Our AI advisors don&apos;t just give generic answers. They ask clarifying 
                questions, consider your specific context, and provide actionable recommendations.
              </p>
              <div className="space-y-4">
                {[
                  "Context-aware responses based on your industry",
                  "Follow-up questions to understand your needs",
                  "Actionable next steps, not just information",
                  "Conversation history for ongoing projects",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-accent-gold flex items-center justify-center flex-shrink-0">
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
                  <div className="w-8 h-8 rounded-lg bg-agent-hr flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">HR</span>
                  </div>
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
                  <div className="w-8 h-8 rounded-lg bg-agent-hr flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">HR</span>
                  </div>
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
