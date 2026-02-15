import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Content Engine",
    description:
        "Create blog posts, LinkedIn articles, social media content, and AI-generated images. Your AI-powered content marketing toolkit.",
    robots: { index: false },
};

export default function ContentEngineLayout({
                                                children,
                                            }: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}