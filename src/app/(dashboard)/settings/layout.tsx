import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Settings",
    description:
        "Configure your profile, company details, and AI preferences to get personalized advice from your CEO Sidekick advisors.",
    robots: { index: false },
};

export default function SettingsLayout({
                                           children,
                                       }: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
