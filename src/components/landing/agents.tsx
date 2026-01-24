// src/components/landing/agents.tsx
// Landing Page Agents Section - Uses centralized agent configuration

"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentAvatar } from "@/components/ui/agent-avatar";
import { getAllAgents, type AgentConfig } from "@/config/agent-config";

export function Agents() {
  // Get all agents from centralized config
  const agents = getAllAgents();

  return (
      <section id="agents" className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-primary-red font-semibold text-sm uppercase tracking-wide mb-3">
              Meet Your AI Advisors
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              A complete C-suite at your fingertips
            </h2>
            <p className="text-lg text-neutral-600">
              Eight specialized AI advisors, each trained on best practices in their domain.
              Switch between advisors seamlessly based on your current challenge.
            </p>
          </div>

          {/* Agents Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>
      </section>
  );
}

// ============================================
// AGENT CARD COMPONENT
// ============================================

interface AgentCardProps {
  agent: AgentConfig;
}

function AgentCard({ agent }: AgentCardProps) {
  return (
      <div className="group bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:border-neutral-300 hover:card-shadow-hover transition-all duration-300">
        {/* Card Header */}
        <div className={`p-5 ${agent.lightColor}`}>
          <div className="flex items-start justify-between mb-3">
            <AgentAvatar
                agentId={agent.id}
                size="lg"
                className="shadow-lg"
            />
            <span className={`text-[10px] font-semibold ${agent.textColor} uppercase tracking-wide`}>
            {agent.subtitle}
          </span>
          </div>
          <h3 className="font-display text-lg font-bold text-neutral-900">
            {agent.name}
          </h3>
        </div>

        {/* Card Body */}
        <div className="p-5">
          <p className="text-neutral-600 text-sm mb-4 leading-relaxed line-clamp-2">
            {agent.description}
          </p>

          {/* Capabilities */}
          <div className="space-y-1.5 mb-4">
            {agent.capabilities.slice(0, 3).map((capability, capIndex) => (
                <div
                    key={capIndex}
                    className="flex items-center gap-2 text-xs text-neutral-700"
                >
                  <div className={`w-1 h-1 rounded-full ${agent.color}`} />
                  {capability}
                </div>
            ))}
          </div>

          {/* Example Prompt */}
          <div className="bg-neutral-50 rounded-lg p-2.5 border border-neutral-100">
            <p className="text-[10px] text-neutral-500 mb-0.5">Try asking:</p>
            <p className="text-xs text-neutral-700 italic line-clamp-2">
              {agent.example}
            </p>
          </div>

          {/* Disclaimer */}
          {agent.disclaimer && (
              <p className="text-[10px] text-neutral-400 mt-2 italic">
                *{agent.disclaimer}
              </p>
          )}
        </div>

        {/* Card Footer */}
        <div className="px-5 pb-5">
          <Link href="/signup">
            <Button
                variant="outline"
                size="sm"
                className="w-full group-hover:border-neutral-400 transition-colors"
            >
              Try {agent.name.split(" ")[0]}
              <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
  );
}