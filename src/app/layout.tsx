import type { Metadata } from "next";
import Script from "next/script";
import { AuthProvider } from "@/components/auth-provider";
import { PageViewTracker } from "@/components/page-view-tracker";
import "./globals.css";

export const metadata: Metadata = {
    metadataBase: new URL("https://ceosidekick.biz"),
    title: {
        default: "CEO Sidekick — AI Business Advisors for Small Business",
        template: "%s | CEO Sidekick",
    },
    description:
        "Get 24/7 access to 7 AI-powered C-suite advisors for strategy, legal, HR, marketing, sales, and more. Executive guidance at a fraction of the cost.",
    keywords: [
        "AI business advisor",
        "virtual CTO",
        "small business AI",
        "AI executive coach",
        "business strategy AI",
        "AI legal advisor",
        "AI HR partner",
        "AI marketing advisor",
        "CEO Sidekick",
    ],
    authors: [{ name: "CEO Sidekick" }],
    creator: "CEO Sidekick",
    openGraph: {
        type: "website",
        locale: "en_US",
        url: "https://ceosidekick.biz",
        siteName: "CEO Sidekick",
        title: "CEO Sidekick — AI Business Advisors for Small Business",
        description:
            "Get 24/7 access to 7 AI business advisors for strategy, legal, HR, marketing, sales, and content creation. Expert guidance for small business — try it free.",
        images: [
            {
                url: "/images/og-image.png",
                width: 1200,
                height: 630,
                alt: "CEO Sidekick — Your AI-Powered C-Suite",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "CEO Sidekick — AI Business Advisors for Small Business",
        description:
            "Get 24/7 access to 7 AI business advisors for strategy, legal, HR, marketing, sales, and content creation. Expert guidance for small business — try it free.",
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
        "AI-powered business advisory platform with 7 virtual C-suite advisors for small businesses.",
    offers: [
        {
            "@type": "Offer",
            name: "Free",
            price: "0",
            priceCurrency: "USD",
            description: "30 messages/month with all 7 AI advisors",
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