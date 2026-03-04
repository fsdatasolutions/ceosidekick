import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Set New Password",
    description: "Set a new password for your CEO Sidekick account.",
    robots: { index: false },
};

export default function ResetPasswordLayout({
                                                children,
                                            }: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
