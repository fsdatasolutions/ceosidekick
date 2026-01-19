// src/app/(dashboard)/layout.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { checkAdminAccess } from "@/lib/admin";
import { UserSection } from "@/components/user-section";
import { MobileNav } from "@/components/mobile-nav";
import { SidebarNav } from "@/components/sidebar-nav";

export default async function DashboardLayout({
                                                children,
                                              }: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  const userName = session.user.name || "User";
  const userEmail = session.user.email || "";
  const userImage = session.user.image;

  // Check admin status from database (secure server-side check)
  const { isAdmin } = await checkAdminAccess(session.user.id);

  return (
      <div className="min-h-screen bg-neutral-50 flex">
        {/* Mobile Navigation */}
        <MobileNav
            userName={userName}
            userEmail={userEmail}
            userImage={userImage}
            isAdmin={isAdmin}
        />

        {/* Desktop Sidebar - Hidden on mobile */}
        <aside className="hidden md:flex w-64 bg-white border-r border-neutral-200 flex-col fixed h-full">
          {/* Logo */}
          <div className="p-6 border-b border-neutral-200">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-primary-red/20 group-hover:shadow-xl group-hover:shadow-primary-red/30 transition-all duration-200">
                <img
                    src="/images/robin-logo.png"
                    alt="CEO SideKick"
                    className="w-6 h-6 object-contain"
                />
              </div>
              <div>
              <span className="font-display font-bold text-lg text-neutral-900">
                CEO Sidekick
              </span>
              </div>
            </Link>
          </div>

          {/* Navigation with Admin View Toggle */}
          <SidebarNav isAdmin={isAdmin} />

          {/* User Section */}
          <UserSection
              name={userName}
              email={userEmail}
              image={userImage}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-64 pt-14 md:pt-0 overflow-auto min-h-screen">
          {children}
        </main>
      </div>
  );
}