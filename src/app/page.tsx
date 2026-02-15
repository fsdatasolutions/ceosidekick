import {
  Header,
  Hero,
  Demo,
  Features,
  Agents,
  HowItWorks,
  Pricing,
  Testimonials,
  CTA,
  Footer,
} from "@/components/landing";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Business Advisors for Small Business",
  description:
      "CEO Sidekick gives you 24/7 access to 7 AI executive advisors — strategy, legal, HR, marketing, sales & more. Start free today.",
  // 143 characters ✅
  alternates: {
    canonical: "https://ceosidekick.biz",
  },
};

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Demo />
        <Features />
        <HowItWorks />
        <Agents />
        <Pricing />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
