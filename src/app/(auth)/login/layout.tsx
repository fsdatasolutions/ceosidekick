import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign In",
    description:
        "Sign in to CEO Sidekick to access your AI business advisors. Get executive-level guidance for strategy, legal, HR, and more.",
    robots: { index: false },
};

export default function LoginLayout({
                                        children,
                                    }: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}