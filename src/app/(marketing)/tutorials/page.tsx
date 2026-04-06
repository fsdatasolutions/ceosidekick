// src/app/(marketing)/tutorials/page.tsx
// Public tutorials page with video walkthroughs organized by category

import type { Metadata } from "next";
import {
    getTutorialsByCategory,
    formatDuration,
    TUTORIALS,
} from "@/lib/tutorials";
import { TutorialsClient } from "./tutorials-client";

export const metadata: Metadata = {
    title: "Tutorials — Learn How to Use CEO Sidekick",
    description:
        "Step-by-step video tutorials covering every feature of CEO Sidekick — AI advisors, content engine, LinkedIn integration, knowledge base, goal tracking, and more.",
    openGraph: {
        title: "Tutorials — Learn How to Use CEO Sidekick",
        description:
            "Step-by-step video tutorials covering every feature of CEO Sidekick.",
    },
};

export default function TutorialsPage() {
    const grouped = getTutorialsByCategory();
    const totalTutorials = TUTORIALS.length;

    return (
        <div className="min-h-screen">
            {/* Hero */}
            <section className="pt-32 pb-16 px-6">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-red/10 text-primary-red text-sm font-medium mb-6">
                        {totalTutorials} Video Tutorials
                    </div>
                    <h1 className="font-display text-4xl sm:text-5xl font-bold text-neutral-900 mb-4">
                        Learn CEO Sidekick
                    </h1>
                    <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
                        Step-by-step video walkthroughs to help you get the most
                        out of every feature. From first login to advanced workflows.
                    </p>
                </div>
            </section>

            {/* Tutorial Categories */}
            <TutorialsClient grouped={grouped} />

            {/* CTA */}
            <section className="py-20 px-6 bg-neutral-900">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="font-display text-3xl font-bold text-white mb-4">
                        Ready to get started?
                    </h2>
                    <p className="text-neutral-400 mb-8">
                        Try CEO Sidekick free with 15 credits per month. No credit card required.
                    </p>
                    <a
                        href="/signup"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-primary-red hover:bg-primary-red-hover text-white font-semibold rounded-xl shadow-lg shadow-primary-red/20 transition-all"
                    >
                        Start Free Trial
                    </a>
                </div>
            </section>
        </div>
    );
}
