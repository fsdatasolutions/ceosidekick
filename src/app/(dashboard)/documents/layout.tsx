import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Document Templates",
    description:
        "Generate professional business documents, contracts, plans, and reports pre-filled with your company information.",
    robots: { index: false },
};

export default function DocumentsLayout({
                                            children,
                                        }: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
