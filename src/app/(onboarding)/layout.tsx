import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const metadata = {
    title: "Welcome to CEO Sidekick",
    description: "Set up your AI advisory team",
    robots: { index: false },
};

export default async function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();
    if (!session?.user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-neutral-50">
            {/* Top bar with logo */}
            <header className="flex items-center justify-between px-6 py-4 md:px-8">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-primary-red/20">
                        <img
                            src="/images/robin-logo.png"
                            alt="CEO Sidekick logo"
                            className="w-6 h-6 object-contain"
                        />
                    </div>
                    <span className="font-display font-bold text-xl text-neutral-900">
                        CEO Sidekick
                    </span>
                </Link>
            </header>

            {/* Main content */}
            <main className="flex items-start justify-center px-4 pb-12 pt-4 md:pt-8">
                <div className="w-full max-w-2xl">
                    {children}
                </div>
            </main>
        </div>
    );
}
