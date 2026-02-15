import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard",
    description:
        "Your CEO Sidekick command center. Access all 7 AI advisors, manage conversations, and track your business insights.",
    robots: { index: false },
};

export default function DashboardLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}