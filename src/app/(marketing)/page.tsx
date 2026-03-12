// src/app/(marketing)/page.tsx
import {
    Hero,
    Demo,
    Features,
    Agents,
    HowItWorks,
    Pricing,
    Testimonials,
    CTA,
} from "@/components/landing";

import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "AI-Powered Business Tools for Small Business & Entrepreneurs",
    description:
        "CEO Sidekick is a suite of AI-powered tools for small businesses: expert advisors, document templates, content creation, goal tracking, and more. Start free.",
    alternates: {
        canonical: "https://ceosidekick.biz",
    },
};

export default function HomePage() {
    return (
        <>
            <Hero />
            <Demo />
            <Features />
            <Agents />
            <HowItWorks />
            <Pricing />
            <Testimonials />
            <CTA />
        </>
    );
}