import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  Settings,
  Star,
} from "lucide-react";
import { UserSection } from "@/components/user-section";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: MessageSquare, label: "Chat", href: "/chat" },
  { icon: BookOpen, label: "Knowledge Base", href: "/knowledge-base" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

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

  return (
      <div className="min-h-screen bg-neutral-50 flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col">
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

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  </li>
              ))}

              {/* Feedback - Bold Red */}
              <li>
                <Link
                    href="/feedback"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-primary-red font-bold hover:bg-red-50 transition-colors"
                >
                  <Star className="w-5 h-5" />
                  Feedback
                </Link>
              </li>
            </ul>
          </nav>

          {/* User Section */}
          <UserSection
              name={userName}
              email={userEmail}
              image={userImage}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
  );
}