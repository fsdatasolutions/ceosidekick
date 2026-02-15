import type { Metadata } from "next";

// NOTE: Pricing is currently behind auth in (dashboard).
// Consider creating a public /pricing page for SEO — it's a high-intent
// search term ("CEO Sidekick pricing") and would help with conversions.
export const metadata: Metadata = {
    title: "Pricing & Plans",
    description:
        "Choose your CEO Sidekick plan. Free, PowerUser ($29/mo), or Pro ($199/mo). Access 7 AI business advisors with flexible message packs.",
    robots: { index: false },
};

export default function PricingLayout({
                                          children,
                                      }: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}