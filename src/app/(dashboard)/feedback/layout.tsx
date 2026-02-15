import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Feedback & Bug Reports",
    description:
        "Report bugs or request new features for CEO Sidekick. Help us improve your AI advisory experience.",
    robots: { index: false },
};

export default function FeedbackLayout({
                                           children,
                                       }: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
