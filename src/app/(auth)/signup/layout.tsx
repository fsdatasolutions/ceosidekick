import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Start Your Free Trial",
    description:
        "Create your free CEO Sidekick account. Get 30 messages/month with 7 AI business advisors — no credit card required.",
    alternates: {
        canonical: "https://ceosidekick.biz/signup",
    },
};

export default function SignupLayout({
                                         children,
                                     }: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}