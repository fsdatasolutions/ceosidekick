// src/app/about/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Us",
    description:
        "CEO Sidekick is a suite of AI-powered tools for entrepreneurs. Learn about our mission, meet the founder, and discover the platform.",
    alternates: {
        canonical: "https://ceosidekick.biz/about",
    },
    openGraph: {
        title: "About CEO Sidekick — AI-Powered Business Tools for Entrepreneurs",
        description:
            "Learn how CEO Sidekick is democratizing business expertise for 33M+ small businesses with a suite of AI-powered tools.",
        url: "https://ceosidekick.biz/about",
        type: "website",
        images: [
            {
                url: "/images/og-image.png",
                width: 1200,
                height: 630,
                alt: "About CEO Sidekick — AI-Powered Business Tools",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "About CEO Sidekick — AI-Powered Business Tools for Entrepreneurs",
        description:
            "Learn how CEO Sidekick is democratizing business expertise for 33M+ small businesses with AI-powered tools.",
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
