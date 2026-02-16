// src/app/about/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Us",
    description:
        "CEO Sidekick gives entrepreneurs 24/7 access to 7 AI-powered C-suite advisors. Learn about our mission, meet the founder, and discover the team behind the platform.",
    alternates: {
        canonical: "https://ceosidekick.biz/about",
    },
    openGraph: {
        title: "About CEO Sidekick — AI Business Advisors for Entrepreneurs",
        description:
            "Learn how CEO Sidekick is democratizing executive guidance for 33M+ small businesses with AI-powered C-suite advisors.",
        url: "https://ceosidekick.biz/about",
        type: "website",
        images: [
            {
                url: "/images/og-image.png",
                width: 1200,
                height: 630,
                alt: "About CEO Sidekick — AI Business Advisors",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "About CEO Sidekick — AI Business Advisors for Entrepreneurs",
        description:
            "Learn how CEO Sidekick is democratizing executive guidance for 33M+ small businesses.",
        images: ["/images/og-image.png"],
    },
};

export default function AboutLayout({
                                        children,
                                    }: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}