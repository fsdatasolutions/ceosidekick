// src/app/about/[advisor]/page.tsx
// Individual advisor detail pages — SEO-optimized, server component
// Dynamic route: /about/technology-partner, /about/executive-coach, etc.
// Linked from LinkedIn Showcase Pages and the main About page

import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    MessageSquare,
    Linkedin,
    ChevronRight,
} from "lucide-react";
import { getAgent, type AgentType } from "@/config/agent-config";
import {
    getAdvisorBySlug,
    advisorSlugs,
    type AdvisorPageContent,
} from "@/config/advisor-page-content";

// ============================================
// STATIC PARAMS (for static generation)
// ============================================

export async function generateStaticParams() {
    return advisorSlugs.map((slug) => ({ advisor: slug }));
}

// ============================================
// METADATA
// ============================================

export async function generateMetadata({
                                           params,
                                       }: {
    params: Promise<{ advisor: string }>;
}) {
    const { advisor } = await params;
    const content = getAdvisorBySlug(advisor);
    if (!content) return {};

    return {
        title: content.metaTitle,
        description: content.metaDescription,
        openGraph: {
            title: content.metaTitle,
            description: content.metaDescription,
            type: "website",
            url: `https://ceosidekick.biz/about/${content.slug}`,
        },
        twitter: {
            card: "summary_large_image",
            title: content.metaTitle,
            description: content.metaDescription,
        },
        alternates: {
            canonical: `https://ceosidekick.biz/about/${content.slug}`,
        },
    };
}

// ============================================
// ACCENT COLOR MAP
// ============================================

const ACCENT_STYLES: Record<
    string,
    {
        bg: string;
        bgLight: string;
        text: string;
        border: string;
        gradient: string;
        badge: string;
        button: string;
        buttonHover: string;
    }
> = {
    technology: {
        bg: "bg-[#00778B]",
        bgLight: "bg-teal-50",
        text: "text-[#00778B]",
        border: "border-teal-200",
        gradient: "from-[#00778B] to-[#005F6B]",
        badge: "bg-teal-50 text-[#00778B]",
        button: "bg-[#00778B]",
        buttonHover: "hover:bg-[#005F6B]",
    },
    coach: {
        bg: "bg-[#FFB81C]",
        bgLight: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        gradient: "from-[#FFB81C] to-[#E5A518]",
        badge: "bg-amber-50 text-amber-700",
        button: "bg-amber-600",
        buttonHover: "hover:bg-amber-700",
    },
    legal: {
        bg: "bg-[#00778B]",
        bgLight: "bg-teal-50",
        text: "text-[#00778B]",
        border: "border-teal-200",
        gradient: "from-[#00778B] to-[#005F6B]",
        badge: "bg-teal-50 text-[#00778B]",
        button: "bg-[#00778B]",
        buttonHover: "hover:bg-[#005F6B]",
    },
    hr: {
        bg: "bg-[#FFB81C]",
        bgLight: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        gradient: "from-[#FFB81C] to-[#E5A518]",
        badge: "bg-amber-50 text-amber-700",
        button: "bg-amber-600",
        buttonHover: "hover:bg-amber-700",
    },
    marketing: {
        bg: "bg-[#00778B]",
        bgLight: "bg-teal-50",
        text: "text-[#00778B]",
        border: "border-teal-200",
        gradient: "from-[#00778B] to-[#005F6B]",
        badge: "bg-teal-50 text-[#00778B]",
        button: "bg-[#00778B]",
        buttonHover: "hover:bg-[#005F6B]",
    },
    sales: {
        bg: "bg-[#C8102E]",
        bgLight: "bg-red-50",
        text: "text-[#C8102E]",
        border: "border-red-200",
        gradient: "from-[#C8102E] to-[#A00D25]",
        badge: "bg-red-50 text-[#C8102E]",
        button: "bg-[#C8102E]",
        buttonHover: "hover:bg-[#A00D25]",
    },
    content: {
        bg: "bg-[#C8102E]",
        bgLight: "bg-red-50",
        text: "text-[#C8102E]",
        border: "border-red-200",
        gradient: "from-[#C8102E] to-[#A00D25]",
        badge: "bg-red-50 text-[#C8102E]",
        button: "bg-[#C8102E]",
        buttonHover: "hover:bg-[#A00D25]",
    },
};

// ============================================
// PAGE COMPONENT
// ============================================

export default async function AdvisorPage({
                                              params,
                                          }: {
    params: Promise<{ advisor: string }>;
}) {
    const { advisor } = await params;
    const content = getAdvisorBySlug(advisor);
    if (!content) notFound();

    const agent = getAgent(content.id);
    if (!agent) notFound();

    const styles = ACCENT_STYLES[content.id];

    // JSON-LD structured data for this advisor
    const advisorJsonLd = {
        "@context": "https://schema.org",
        "@type": "Service",
        name: agent.name,
        description: content.metaDescription,
        provider: {
            "@type": "Organization",
            name: "CEO Sidekick",
            url: "https://ceosidekick.biz",
        },
        url: `https://ceosidekick.biz/about/${content.slug}`,
        serviceType: "AI Business Advisory",
    };

    return (
        <>
            {/* JSON-LD */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(advisorJsonLd) }}
            />

            <div className="min-h-screen bg-white">
                {/* ============================== */}
                {/* BREADCRUMB                     */}
                {/* ============================== */}
                <div className="pt-24 sm:pt-28">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <nav className="flex items-center gap-2 text-sm text-neutral-500">
                            <Link href="/about" className="hover:text-neutral-900 transition-colors">
                                About
                            </Link>
                            <ChevronRight className="w-3.5 h-3.5" />
                            <span className="text-neutral-900 font-medium">{agent.name}</span>
                        </nav>
                    </div>
                </div>

                {/* ============================== */}
                {/* HERO SECTION                   */}
                {/* ============================== */}
                <section className="pt-8 pb-16 sm:pt-12 sm:pb-24">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-5 gap-10 items-center">
                            {/* Avatar */}
                            <div className="md:col-span-2 flex justify-center">
                                <div className="relative">
                                    <div
                                        className={`w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden border-2 ${styles.border} shadow-lg`}
                                    >
                                        <Image
                                            src={agent.avatarUrl}
                                            alt={agent.altText}
                                            width={256}
                                            height={256}
                                            className="w-full h-full object-cover"
                                            priority
                                        />
                                    </div>
                                    {/* Decorative accent */}
                                    <div
                                        className={`absolute -bottom-3 -right-3 w-20 h-20 rounded-xl -z-10 ${styles.bg} opacity-10`}
                                        aria-hidden="true"
                                    />
                                </div>
                            </div>

                            {/* Hero text */}
                            <div className="md:col-span-3">
                                <p
                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${styles.badge} text-sm font-medium mb-4`}
                                >
                                    {agent.subtitle}
                                </p>
                                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 mb-4">
                                    {agent.name}
                                </h1>
                                <p className={`text-xl font-medium ${styles.text} mb-4`}>
                                    {content.heroTagline}
                                </p>
                                <p className="text-neutral-600 text-lg leading-relaxed mb-8">
                                    {content.heroDescription}
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <Link
                                        href="/signup"
                                        className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl ${styles.button} ${styles.buttonHover} text-white font-semibold transition-colors shadow-lg`}
                                    >
                                        {content.ctaText}
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                    {content.linkedinShowcase && (
                                        <a
                                            href={content.linkedinShowcase}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-neutral-200 text-neutral-700 font-semibold hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
                                        >
                                            <Linkedin className="w-4 h-4" />
                                            Follow on LinkedIn
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================== */}
                {/* CAPABILITIES                   */}
                {/* ============================== */}
                <section className="py-16 sm:py-24 bg-neutral-50" aria-labelledby="capabilities-heading">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-12">
                            <h2
                                id="capabilities-heading"
                                className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 mb-4"
                            >
                                What the {agent.name} can help with
                            </h2>
                            <p className="text-neutral-500 text-lg max-w-2xl mx-auto">
                                Deep domain expertise delivered through natural conversation — ask anything, anytime.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-6">
                            {content.capabilities.map((cap) => (
                                <div
                                    key={cap.title}
                                    className={`rounded-2xl border ${styles.border} bg-white p-8 transition-all duration-200 hover:shadow-md`}
                                >
                                    <h3 className="font-display text-xl font-bold text-neutral-900 mb-3">
                                        {cap.title}
                                    </h3>
                                    <p className="text-neutral-600 leading-relaxed">{cap.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============================== */}
                {/* USE CASES & SAMPLE QUESTIONS   */}
                {/* ============================== */}
                <section className="py-16 sm:py-24" aria-labelledby="usecases-heading">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
                            {/* Use Cases */}
                            <div>
                                <h2
                                    id="usecases-heading"
                                    className="font-display text-2xl sm:text-3xl font-bold text-neutral-900 mb-6"
                                >
                                    Common use cases
                                </h2>
                                <div className="space-y-4">
                                    {content.useCases.map((useCase) => (
                                        <div key={useCase} className="flex items-start gap-3">
                                            <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${styles.text}`} />
                                            <p className="text-neutral-700 leading-relaxed">{useCase}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Sample Questions */}
                            <div>
                                <h2 className="font-display text-2xl sm:text-3xl font-bold text-neutral-900 mb-6">
                                    Try asking
                                </h2>
                                <div className="space-y-3">
                                    {content.sampleQuestions.map((question) => (
                                        <div
                                            key={question}
                                            className={`flex items-start gap-3 p-4 rounded-xl ${styles.bgLight} border ${styles.border}`}
                                        >
                                            <MessageSquare className={`w-5 h-5 mt-0.5 flex-shrink-0 ${styles.text}`} />
                                            <p className="text-neutral-700 text-sm leading-relaxed italic">
                                                &ldquo;{question}&rdquo;
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================== */}
                {/* CTA                            */}
                {/* ============================== */}
                <section className="py-16 sm:py-24 bg-neutral-50" aria-labelledby="advisor-cta-heading">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                        <h2
                            id="advisor-cta-heading"
                            className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 mb-6"
                        >
                            Ready to talk to your {agent.name}?
                        </h2>
                        <p className="text-neutral-600 text-lg mb-10 max-w-xl mx-auto">
                            Start with 30 free messages per month. No credit card required. Get expert guidance in
                            seconds.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/signup"
                                className={`inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl ${styles.button} ${styles.buttonHover} text-white font-semibold transition-colors shadow-lg`}
                            >
                                Start Free Trial
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link
                                href="/about"
                                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl border-2 border-neutral-200 text-neutral-700 font-semibold hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Meet All Advisors
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}