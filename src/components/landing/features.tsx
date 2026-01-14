"use client";

import { 
  Clock, 
  DollarSign, 
  Brain, 
  Shield, 
  Zap,
  Users
} from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "24/7 Availability",
    description:
      "Get executive-level guidance whenever you need it. No waiting for appointments or callbacks.",
  },
  {
    icon: DollarSign,
    title: "99% Cost Savings",
    description:
      "Access C-suite expertise for less than $100/month vs. $500K+ for a traditional executive team.",
  },
  {
    icon: Brain,
    title: "Deep Business Context",
    description:
      "Our AI learns your business, industry, and preferences to provide personalized strategic advice.",
  },
  {
    icon: Shield,
    title: "Confidential & Secure",
    description:
      "Enterprise-grade security with full data isolation. Your business information stays private.",
  },
  {
    icon: Zap,
    title: "Instant Expertise",
    description:
      "From tech strategy to legal questions, get informed answers in seconds, not days.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Share conversations with your team and build a knowledge base of strategic decisions.",
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-primary-red font-semibold text-sm uppercase tracking-wide mb-3">
            Why CEO Sidekick
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
            Executive guidance without the executive price tag
          </h2>
          <p className="text-lg text-neutral-600">
            Stop Googling business decisions. Get real strategic advice from AI advisors 
            trained on best practices across every business function.
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
                <feature.icon className="w-6 h-6 text-primary-red" />
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
            { value: "50+", label: "Business Functions Covered" },
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
