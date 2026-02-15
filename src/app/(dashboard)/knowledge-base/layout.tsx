import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Company Library",
    description:
        "Upload and manage your business documents. Get AI-powered search and answers based on your company's knowledge base.",
    robots: { index: false },
};

export default function KnowledgeBaseLayout({
                                                children,
                                            }: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}