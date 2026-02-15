import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Chat with AI Advisors",
    description:
        "Chat one-on-one with AI executive advisors for strategy, legal, HR, marketing, sales, and content. Get answers in seconds.",
    robots: { index: false },
};

export default function ChatLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}