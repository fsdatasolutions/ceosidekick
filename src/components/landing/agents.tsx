"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentAvatar } from "@/components/ui/agent-avatar";

const agents = [
  {
    id: "technology",
    name: "Technology Partner",
    subtitle: "Virtual CTO/CIO",
    color: "bg-accent-teal",
    lightColor: "bg-accent-teal-light",
    textColor: "text-accent-teal",
    description:
        "Technology and automation strategy advisor. Get guidance on tech stack decisions, digital transformation, and build vs. buy analysis.",
    capabilities: [
      "Technology stack recommendations",
      "Digital transformation roadmaps",
      "Vendor evaluation & selection",
      "IT budget optimization",
      "Security & compliance guidance",
    ],
    example: '"Should I build a custom app or use off-the-shelf software?"',
  },
  {
    id: "coach",
    name: "Executive Coach",
    subtitle: "Leadership Partner",
    color: "bg-agent-coach",
    lightColor: "bg-purple-100",
    textColor: "text-agent-coach",
    description:
        "Leadership development and strategic thinking partner. Prepare for difficult conversations, set OKRs, and develop as a leader.",
    capabilities: [
      "Decision-making frameworks",
      "Leadership development",
      "Difficult conversation prep",
      "Goal setting (OKRs/KPIs)",
      "Work-life balance coaching",
    ],
    example: '"Help me prepare for a difficult conversation with an underperforming employee"',
  },
  {
    id: "legal",
    name: "Legal Advisor",
    subtitle: "Contract & Compliance",
    color: "bg-agent-legal",
    lightColor: "bg-blue-100",
    textColor: "text-agent-legal",
    description:
        "General legal guidance and document review. Get contract red flags identified and understand business structure options.",
    capabilities: [
      "Contract review & red flags",
      "Terms of service guidance",
      "Business structure advice",
      "IP protection overview",
      "Compliance checklists",
    ],
    example: '"Review this freelancer contract for red flags"',
    disclaimer: "Not a substitute for licensed legal counsel",
  },
  {
    id: "hr",
    name: "HR Partner",
    subtitle: "People Operations",
    color: "bg-agent-hr",
    lightColor: "bg-green-100",
    textColor: "text-agent-hr",
    description:
        "Human resources guidance and documentation. Create job descriptions, develop interview questions, and build HR processes.",
    capabilities: [
      "Job description creation",
      "Interview question development",
      "Performance review frameworks",
      "Onboarding checklists",
      "Employee handbook guidance",
    ],
    example: '"Help me write a job description for a marketing manager"',
  },
  {
    id: "marketing",
    name: "Marketing Partner",
    subtitle: "Growth & Brand",
    color: "bg-pink-600",
    lightColor: "bg-pink-100",
    textColor: "text-pink-600",
    description:
        "Marketing strategy and brand development advisor. Plan campaigns, develop positioning, and optimize your marketing spend.",
    capabilities: [
      "Marketing strategy development",
      "Brand positioning & messaging",
      "Digital marketing campaigns",
      "Content marketing planning",
      "Marketing analytics & ROI",
    ],
    example: '"What marketing channels should I focus on with a $5K monthly budget?"',
  },
  {
    id: "sales",
    name: "Sales Partner",
    subtitle: "Revenue & Deals",
    color: "bg-orange-600",
    lightColor: "bg-orange-100",
    textColor: "text-orange-600",
    description:
        "Sales strategy and deal-closing advisor. Build your sales process, handle objections, and improve your close rate.",
    capabilities: [
      "Sales process development",
      "Pipeline management",
      "Objection handling scripts",
      "Proposal & pricing strategy",
      "Sales team coaching",
    ],
    example: '"How do I handle when prospects say we\'re too expensive?"',
  },
  {
    id: "knowledge",
    name: "Knowledge Base",
    subtitle: "Company AI",
    color: "bg-agent-knowledge",
    lightColor: "bg-indigo-100",
    textColor: "text-agent-knowledge",
    description:
        "Company-specific AI trained on your documents. Upload SOPs, meeting notes, and policies for instant Q&A with citations.",
    capabilities: [
      "Document upload & indexing",
      "Semantic search across docs",
      "Q&A with source citations",
      "Meeting notes summarization",
      "New employee onboarding",
    ],
    example: '"What was decided in last month\'s strategy meeting?"',
  },
  {
    id: "content",
    name: "Content Engine",
    subtitle: "Thought Leadership",
    color: "bg-primary-red",
    lightColor: "bg-primary-red-light",
    textColor: "text-primary-red",
    description:
        "AI-powered content generation for marketing and thought leadership. Create blog posts, social media, and marketing copy.",
    capabilities: [
      "Blog post generation",
      "Social media content",
      "Marketing copy",
      "Email campaigns",
      "Thought leadership pieces",
    ],
    example: '"Write a LinkedIn post about AI trends in my industry"',
  },
];

export function Agents() {
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
                <div
                    key={agent.id}
                    className="group bg-white rounded-2xl border border-neutral-200 overflow-hidden hover:border-neutral-300 hover:card-shadow-hover transition-all duration-300"
                >
                  {/* Card Header */}
                  <div className={`p-5 ${agent.lightColor}`}>
                    <div className="flex items-start justify-between mb-3">
                      <AgentAvatar agentId={agent.id} size="lg" className="shadow-lg" />
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
                      <p className="text-xs text-neutral-700 italic line-clamp-2">{agent.example}</p>
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
                          className={`w-full group-hover:border-neutral-400 transition-colors`}
                      >
                        Try {agent.name.split(" ")[0]}
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
            ))}
          </div>
        </div>
      </section>
  );
}