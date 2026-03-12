"use client";

import {
  MessageSquare,
  FileText,
  FolderOpen,
  PenTool,
  Target,
  MessagesSquare
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "AI Advisors",
    description:
        "Chat with 7 specialized AI advisors across strategy, technology, legal, HR, marketing, sales, and content. Context-aware guidance 24/7.",
  },
  {
    icon: FileText,
    title: "Document Templates",
    description:
        "Generate professional business documents — contracts, plans, reports, proposals — tailored to your company context in seconds.",
  },
  {
    icon: FolderOpen,
    title: "Company Library",
    description:
        "Upload your business documents and build a searchable knowledge base. Your AI advisors reference your data for personalized answers.",
  },
  {
    icon: PenTool,
    title: "Content Engine",
    description:
        "Create blog posts, LinkedIn articles, social media content, newsletters, and marketing campaigns — all with AI assistance.",
  },
  {
    icon: Target,
    title: "Goals & Action Plans",
    description:
        "Set business goals, get AI-generated action plans with milestones, and track your progress step by step.",
  },
  {
    icon: MessagesSquare,
    title: "Round Table",
    description:
        "Bring multiple AI advisors together in a single conversation for cross-functional perspectives on complex business decisions.",
  },
];

export function Features() {
  return (
      <section id="tools" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-primary-red font-semibold text-sm uppercase tracking-wide mb-3">
              Your Business Toolkit
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Everything your business needs, powered by AI
            </h2>
            <p className="text-lg text-neutral-600">
              Six integrated tools designed for small businesses and entrepreneurs.
              From expert advice to content creation — stop cobbling together a dozen apps.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
                <div
                    key={index}
                    className="group relative p-6 rounded-2xl border border-neutral-200 bg-neutral-50/50 hover:bg-white hover:border-neutral-300 hover:card-shadow transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-red-light flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-primary-red" aria-hidden="true" />
                  </div>
                  <h3 className="font-display text-xl font-semibold text-neutral-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "6", label: "AI-Powered Tools" },
              { value: "24/7", label: "Always Available" },
              { value: "99%", label: "Cost Savings vs. Hiring" },
              { value: "<10s", label: "Average Response Time" },
            ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="font-display text-4xl font-bold text-neutral-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-neutral-600">{stat.label}</div>
                </div>
            ))}
          </div>
        </div>
      </section>
  );
}
