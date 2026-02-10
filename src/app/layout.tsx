import type { Metadata } from "next";
import Script from "next/script";
import { AuthProvider } from "@/components/auth-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "CEO Sidekick | Your AI-Powered C-Suite",
  description:
      "On-demand access to AI executive advisors across strategy, technology, legal, HR, and more. Enterprise-grade guidance at a fraction of the cost.",
  keywords: [
    "AI business advisor",
    "virtual CTO",
    "AI executive coach",
    "small business AI",
    "startup advisor",
    "AI legal advisor",
    "AI HR advisor",
  ],
  authors: [{ name: "Full Stack Data Solutions" }],
  openGraph: {
    title: "CEO Sidekick | Your AI-Powered C-Suite",
    description:
        "On-demand access to AI executive advisors across strategy, technology, legal, HR, and more.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CEO Sidekick | Your AI-Powered C-Suite",
    description:
        "On-demand access to AI executive advisors across strategy, technology, legal, HR, and more.",
  },
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
            href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@300..700&display=swap"
            rel="stylesheet"
        />
      </head>
      <body className="antialiased">
      <AuthProvider>
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