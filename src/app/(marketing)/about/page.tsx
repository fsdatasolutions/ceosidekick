// src/app/about/page.tsx
// About Us page — public, SEO-optimized, server component
// Advisor data sourced from centralized agent-config.ts
// Advisor cards now link to individual detail pages at /about/[advisor]
// Sections: Hero, Mission/Vision, Founder, AI Advisor Team, Values, CTA

import Link from "next/link";
import Image from "next/image";
import {
    BookOpen,
    ArrowRight,
    Lightbulb,
    Shield,
    Heart,
    Zap,
    Globe,
    Rocket,
    Users,
} from "lucide-react";
import { getAllAgents, AGENT_COLORS, type AgentType } from "@/config/agent-config";
import { advisorPageContent } from "@/config/advisor-page-content";

// ============================================
// STRUCTURED DATA (JSON-LD)
// ============================================

const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CEO Sidekick",
    url: "https://ceosidekick.biz",
    logo: "https://ceosidekick.biz/images/robin-logo.png",
    description:
        "AI-powered business advisory platform providing entrepreneurs and small businesses access to specialized AI C-suite advisors.",
    founder: {
        "@type": "Person",
        name: "Shannon",
        jobTitle: "Founder & CEO",
    },
    foundingDate: "2024",
    sameAs: [],
    contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        url: "https://ceosidekick.biz",
    },
};

// ============================================
// BORDER COLORS (mapped from agent config)
// ============================================

const BORDER_COLORS: Record<AgentType, string> = {
    technology: "border-teal-200",
    coach: "border-purple-200",
    legal: "border-blue-200",
    hr: "border-green-200",
    marketing: "border-pink-200",
    sales: "border-orange-200",
    content: "border-red-200",
};

// ============================================
// AGENT ID TO SLUG MAPPING
// ============================================

const AGENT_SLUG_MAP: Record<AgentType, string> = {
    technology: "technology-partner",
    coach: "executive-coach",
    legal: "legal-advisor",
    hr: "hr-partner",
    marketing: "marketing-partner",
    sales: "sales-partner",
    content: "content-engine",
};

// ============================================
// COMPANY VALUES
// ============================================

const values = [
    {
        icon: Lightbulb,
        title: "Democratize Expertise",
        description:
            "Every entrepreneur deserves access to the same caliber of guidance that Fortune 500 CEOs rely on. We make executive-level advice accessible and affordable.",
        color: "text-amber-600",
        bgColor: "bg-amber-50",
    },
    {
        icon: Shield,
        title: "Trust & Transparency",
        description:
            "Your business data stays yours. We build with privacy-first architecture, never train on your conversations, and are always upfront about what AI can and cannot do.",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
    },
    {
        icon: Heart,
        title: "Founder Empathy",
        description:
            "We are founders building for founders. Every feature is shaped by the real challenges of running a business — because we face them too.",
        color: "text-rose-600",
        bgColor: "bg-rose-50",
    },
    {
        icon: Zap,
        title: "Speed to Impact",
        description:
            "Answers in seconds, not weeks. Our advisors are available 24/7 so you can make informed decisions at the pace your business demands.",
        color: "text-teal-600",
        bgColor: "bg-teal-50",
    },
];

// ============================================
// PAGE COMPONENT
// ============================================

export default function AboutPage() {
    const agents = getAllAgents();

    return (
        <>
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(organizationJsonLd),
                }}
            />

            <div className="min-h-screen bg-white">
                {/* ============================== */}
                {/* HERO SECTION — Light           */}
                {/* ============================== */}
                <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <p className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-sm text-neutral-600 font-medium mb-8">
                            <Rocket className="w-4 h-4 text-[#C8102E]" />
                            Building the future of business advisory
                        </p>
                        <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-900 mb-6">
                            Your AI-Powered{" "}
                            <span className="bg-gradient-to-r from-[#C8102E] via-[#FFB81C] to-[#00778B] bg-clip-text text-transparent">
                C-Suite
              </span>
                        </h1>
                        <p className="text-lg sm:text-xl text-neutral-500 max-w-2xl mx-auto leading-relaxed">
                            CEO Sidekick gives entrepreneurs and small business owners 24/7
                            access to AI-powered executive advisors — so you can make smarter
                            decisions, faster.
                        </p>
                    </div>
                </section>

                {/* ============================== */}
                {/* MISSION & VISION               */}
                {/* ============================== */}
                <section
                    className="py-20 sm:py-28 bg-neutral-50"
                    aria-labelledby="mission-heading"
                >
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
                            {/* Mission */}
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-sm font-medium text-[#C8102E] mb-4">
                                    <Globe className="w-4 h-4" />
                                    Our Mission
                                </div>
                                <h2
                                    id="mission-heading"
                                    className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 mb-6"
                                >
                                    Leveling the playing field for every entrepreneur
                                </h2>
                                <p className="text-neutral-600 text-lg leading-relaxed mb-4">
                                    Over 33 million small businesses in the U.S. alone operate
                                    without access to the executive guidance that larger companies
                                    take for granted. Most founders wear every hat — CEO, CTO, CFO,
                                    head of HR — while making critical decisions in isolation.
                                </p>
                                <p className="text-neutral-600 text-lg leading-relaxed">
                                    CEO Sidekick exists to change that. We provide an AI-powered
                                    advisory team that delivers enterprise-grade strategic guidance
                                    at a fraction of the cost of traditional consulting.
                                </p>
                            </div>

                            {/* Vision */}
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-sm font-medium text-[#00778B] mb-4">
                                    <Lightbulb className="w-4 h-4" />
                                    Our Vision
                                </div>
                                <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 mb-6">
                                    A world where no founder builds alone
                                </h2>
                                <p className="text-neutral-600 text-lg leading-relaxed mb-4">
                                    We envision a future where every business owner — regardless of
                                    budget, location, or network — has instant access to world-class
                                    strategic advice whenever they need it.
                                </p>
                                <p className="text-neutral-600 text-lg leading-relaxed">
                                    By combining advanced AI with deep domain expertise across
                                    technology, law, HR, marketing, sales, and leadership, we are
                                    building the advisor that every entrepreneur deserves but few
                                    can currently afford.
                                </p>
                            </div>
                        </div>

                        {/* Stats bar */}
                        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 p-8 rounded-2xl bg-white border border-neutral-200 shadow-sm">
                            {[
                                { value: "7", label: "AI Advisors" },
                                { value: "33M+", label: "Small Businesses Underserved" },
                                { value: "24/7", label: "Availability" },
                                { value: "< $1", label: "Per Consultation" },
                            ].map((stat) => (
                                <div key={stat.label} className="text-center">
                                    <div className="font-display text-3xl sm:text-4xl font-bold text-neutral-900">
                                        {stat.value}
                                    </div>
                                    <div className="text-sm text-neutral-500 mt-1">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============================== */}
                {/* FOUNDER SECTION                */}
                {/* ============================== */}
                <section
                    className="py-20 sm:py-28"
                    aria-labelledby="founder-heading"
                >
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-sm font-medium text-amber-700 mb-4">
                                The Founder
                            </p>
                            <h2
                                id="founder-heading"
                                className="font-display text-3xl sm:text-4xl font-bold text-neutral-900"
                            >
                                Built by a founder, for founders
                            </h2>
                        </div>

                        <div className="grid md:grid-cols-5 gap-10 items-center">
                            {/* Photo placeholder */}
                            <div className="md:col-span-2 flex justify-center">
                                <div className="relative">
                                    <div className="w-64 h-64 sm:w-72 sm:h-72 rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center overflow-hidden border border-neutral-200">

                                        <Image src="/images/founder.jpg" alt="Shannon, Founder and CEO of CEO Sidekick" width={288} height={288} className="rounded-2xl object-cover" />
                                    </div>
                                    {/* Decorative accent */}
                                    <div
                                        className="absolute -bottom-3 -right-3 w-24 h-24 rounded-xl -z-10 bg-[#C8102E]/10"
                                        aria-hidden="true"
                                    />
                                </div>
                            </div>

                            {/* Bio */}
                            <div className="md:col-span-3">
                                <h3 className="font-display text-2xl font-bold text-neutral-900 mb-1">
                                    Shannon
                                </h3>
                                <p className="text-[#C8102E] font-medium mb-6">
                                    Founder &amp; CEO
                                </p>
                                <div className="space-y-4 text-neutral-600 text-lg leading-relaxed">
                                    <p>
                                        Shannon is a full-stack technologist and entrepreneur who has
                                        spent years helping businesses harness the power of data and
                                        technology. As the founder of Full Stack Data Solutions, a
                                        consultancy specializing in data engineering and analytics,
                                        Shannon saw firsthand how small business owners struggled to
                                        access the strategic guidance that larger organizations take
                                        for granted.
                                    </p>
                                    <p>
                                        That gap — between the advice founders need and what they can
                                        actually afford — became the spark for CEO Sidekick. By
                                        combining deep expertise in AI, cloud architecture, and
                                        business operations, Shannon set out to build an advisory
                                        platform that puts a full C-suite in every entrepreneur&#39;s
                                        pocket.
                                    </p>
                                    <p>
                                        CEO Sidekick is bootstrapped and self-funded, reflecting
                                        Shannon&#39;s conviction that the best products are built with
                                        the same resourcefulness and grit that define the
                                        entrepreneurs they serve.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================== */}
                {/* AI ADVISOR TEAM                */}
                {/* ============================== */}
                <section
                    className="py-20 sm:py-28 bg-neutral-50"
                    aria-labelledby="advisors-heading"
                >
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-14">
                            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 text-sm font-medium text-[#00778B] mb-4">
                                The Advisory Team
                            </p>
                            <h2
                                id="advisors-heading"
                                className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 mb-4"
                            >
                                Seven specialized AI advisors, one unified platform
                            </h2>
                            <p className="text-neutral-500 text-lg max-w-2xl mx-auto">
                                Each advisor brings deep domain expertise to help you navigate
                                the challenges of running and growing your business.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {agents.map((agent) => {
                                const slug = AGENT_SLUG_MAP[agent.id];
                                return (
                                    <Link
                                        key={agent.id}
                                        href={`/about/${slug}`}
                                        className={`group relative rounded-2xl border ${BORDER_COLORS[agent.id]} bg-white p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
                                    >
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border border-neutral-200 shadow-sm">
                                                <Image
                                                    src={agent.avatarUrl}
                                                    alt={agent.altText}
                                                    width={56}
                                                    height={56}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <h3 className="font-display font-bold text-lg text-neutral-900 group-hover:text-neutral-700 transition-colors">
                                                    {agent.name}
                                                </h3>
                                                <p className={`text-sm ${agent.textColor} font-medium`}>
                                                    {agent.subtitle}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-neutral-600 text-sm leading-relaxed mb-3">
                                            {agent.description}
                                        </p>
                                        <span className={`inline-flex items-center gap-1 text-sm font-medium ${agent.textColor} group-hover:gap-2 transition-all`}>
                                            Learn more
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </span>
                                    </Link>
                                );
                            })}

                            {/* Round Table card */}
                            <article className="group relative rounded-2xl border border-amber-200 bg-white p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-sm">
                                        <BookOpen className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-display font-bold text-lg text-neutral-900">
                                            Round Table
                                        </h3>
                                        <p className="text-sm text-amber-700 font-medium">
                                            Multi-Advisor Collaboration
                                        </p>
                                    </div>
                                </div>
                                <p className="text-neutral-600 text-sm leading-relaxed">
                                    Bring multiple advisors together in a single conversation.
                                    Get synthesized perspectives from your entire virtual C-suite
                                    on complex, cross-functional decisions.
                                </p>
                            </article>
                        </div>
                    </div>
                </section>

                {/* ============================== */}
                {/* VALUES                         */}
                {/* ============================== */}
                <section
                    className="py-20 sm:py-28"
                    aria-labelledby="values-heading"
                >
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-14">
                            <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-sm font-medium text-[#C8102E] mb-4">
                                What Drives Us
                            </p>
                            <h2
                                id="values-heading"
                                className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 mb-4"
                            >
                                Our values
                            </h2>
                            <p className="text-neutral-500 text-lg max-w-2xl mx-auto">
                                These principles guide every decision we make — from product
                                development to how we interact with the entrepreneurs we serve.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-8">
                            {values.map((value) => {
                                const Icon = value.icon;
                                return (
                                    <div
                                        key={value.title}
                                        className="bg-neutral-50 rounded-2xl border border-neutral-100 p-8"
                                    >
                                        <div
                                            className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${value.bgColor} mb-5`}
                                        >
                                            <Icon className={`w-6 h-6 ${value.color}`} />
                                        </div>
                                        <h3 className="font-display text-xl font-bold text-neutral-900 mb-3">
                                            {value.title}
                                        </h3>
                                        <p className="text-neutral-600 leading-relaxed">
                                            {value.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ============================== */}
                {/* CTA                            */}
                {/* ============================== */}
                <section
                    className="py-20 sm:py-28 bg-neutral-50"
                    aria-labelledby="cta-heading"
                >
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2
                            id="cta-heading"
                            className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 mb-6"
                        >
                            Ready to meet your advisory team?
                        </h2>
                        <p className="text-neutral-600 text-lg mb-10 max-w-xl mx-auto">
                            Start with 30 free messages per month. No credit card required.
                            Get answers from 7 specialized AI advisors in seconds.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/signup"
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#C8102E] text-white font-semibold hover:bg-[#A00D25] transition-colors shadow-lg shadow-red-500/20"
                            >
                                Start Free Trial
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border-2 border-neutral-200 text-neutral-700 font-semibold hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
                            >
                                Learn More
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}