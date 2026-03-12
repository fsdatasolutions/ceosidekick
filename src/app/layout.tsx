import type { Metadata } from "next";
import Script from "next/script";
import { AuthProvider } from "@/components/auth-provider";
import { PageViewTracker } from "@/components/page-view-tracker";
import "./globals.css";

export const metadata: Metadata = {
    metadataBase: new URL("https://ceosidekick.biz"),
    title: {
        default: "CEO Sidekick — AI-Powered Tools for Small Business",
        template: "%s | CEO Sidekick",
    },
    description:
        "AI-powered business tools for small businesses and entrepreneurs. Expert advisors, document templates, content creation, goal tracking, and a company knowledge base — all in one platform.",
    keywords: [
        "AI business tools",
        "small business AI",
        "AI business advisor",
        "AI content creation",
        "business document templates",
        "AI goal tracking",
        "AI knowledge base",
        "entrepreneur tools",
        "virtual CTO",
        "CEO Sidekick",
    ],
    authors: [{ name: "CEO Sidekick" }],
    creator: "CEO Sidekick",
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://ceosidekick.biz",
        siteName: "CEO Sidekick",
        title: "CEO Sidekick — AI-Powered Tools for Small Business",
        description:
            "AI-powered business tools for entrepreneurs: expert advisors, document templates, content engine, goal tracking, and a company knowledge base. Try it free.",
        images: [
            {
                url: "/images/og-image.png",
                width: 1200,
                height: 630,
                alt: "CEO Sidekick — AI-Powered Tools for Small Business",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "CEO Sidekick — AI-Powered Tools for Small Business",
        description:
            "AI-powered business tools for entrepreneurs: expert advisors, document templates, content engine, goal tracking, and a company knowledge base. Try it free.",
        images: ["/images/og-image.png"],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
    alternates: {
        canonical: "https://ceosidekick.biz",
    },
};

// JSON-LD structured data for rich search results
const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CEO Sidekick",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://ceosidekick.biz",
    description:
        "AI-powered business toolkit for small businesses — expert advisors, document templates, content creation, goal tracking, and a company knowledge base.",
    offers: [
        {
            "@type": "Offer",
            name: "Free",
            price: "0",
            priceCurrency: "USD",
            description: "15 credits/month with all AI-powered tools and advisors",
        },
        {
            "@type": "Offer",
            name: "PowerUser",
            price: "29",
            priceCurrency: "USD",
            description:
                "250 messages/month with Round Table multi-advisor collaboration",
        },
        {
            "@type": "Offer",
            name: "Pro",
            price: "199",
            priceCurrency: "USD",
            description:
                "2,500 messages/month with API access and custom integrations",
        },
    ],
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="scroll-smooth">
        <head>
            <link
                rel="preconnect"
                href="https://fonts.googleapis.com"
            />
            <link
                rel="preconnect"
                href="https://fonts.gstatic.com"
                crossOrigin="anonymous"
            />
            <link
                href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@300..700&display=swap"
                rel="stylesheet"
            />
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(jsonLd),
                }}
            />
        </head>
        <body className="antialiased">
        <AuthProvider>
            <PageViewTracker />
            {children}
        </AuthProvider>

        {/* Google Analytics */}
        <Script
            src="https://www.googletagmanager.com/gtag/js?id=G-S0PSXLTWB7"
            strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
            {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', 'G-S0PSXLTWB7');
                    `}
        </Script>
        </body>
        </html>
    );
}