import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Round Table",
    description:
        "Get multi-perspective guidance from multiple AI advisors in one conversation. Consult multiple advisors simultaneously.",
    robots: { index: false },
};

export default function RoundTableLayout({
                                             children,
                                         }: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}