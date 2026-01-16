import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-neutral-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-red/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-teal/10 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-primary-red/20 group-hover:shadow-xl group-hover:shadow-primary-red/30 transition-all duration-200">
              <img
                  src="/images/robin-logo.png"
                  alt="CEO SideKick"
                  className="w-6 h-6 object-contain"
              />
            </div>
            <span className="font-display font-bold text-xl text-white">
              CEO Sidekick
            </span>
          </Link>
        </div>

        <div className="relative z-10">
          <blockquote className="text-xl text-white font-medium leading-relaxed mb-4">
            &ldquo;CEO Sidekick has become my go-to for every strategic decision. 
            It&apos;s like having a board of advisors available 24/7.&rdquo;
          </blockquote>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold">
              SC
            </div>
            <div>
              <p className="text-white font-medium">Sarah Chen</p>
              <p className="text-neutral-400 text-sm">Founder, TechStart Solutions</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-neutral-500 text-sm">
          © {new Date().getFullYear()} Full Stack Data Solutions
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
