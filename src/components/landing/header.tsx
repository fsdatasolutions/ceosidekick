// src/components/landing/header.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#tools", label: "Tools" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#testimonials", label: "Testimonials" },
  { href: "/about", label: "About" },
  { href: "/blog", label: "Blog" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const isSignedIn = status === "authenticated";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
      <header
          className={cn(
              "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
              isScrolled || isMobileMenuOpen
                  ? "bg-white/95 backdrop-blur-md border-b border-neutral-200/50 shadow-sm py-3"
                  : "bg-transparent py-5"
          )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-between" aria-label="Main navigation">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-primary-red/20 group-hover:shadow-xl group-hover:shadow-primary-red/30 transition-all duration-200">
                <img
                    src="/images/robin-logo.png"
                    alt="CEO Sidekick logo — AI-powered business tools for entrepreneurs"
                    className="w-6 h-6 object-contain"
                />
              </div>
              <div className="flex flex-col">
              <span className="font-display font-bold text-xl text-neutral-900 leading-tight">
                CEO Sidekick
              </span>
                <span className="text-[10px] text-neutral-500 font-medium tracking-wide uppercase">
                AI-Powered Business Tools
              </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                  <Link
                      key={link.href}
                      href={link.href}
                      className="text-neutral-600 hover:text-neutral-900 font-medium transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
              ))}
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-4">
              {isSignedIn ? (
                  <>
                    <Link href="/dashboard">
                      <Button size="sm">Dashboard</Button>
                    </Link>
                    {session?.user?.image ? (
                        <img
                            src={session.user.image}
                            alt={session.user.name || "User avatar"}
                            className="w-9 h-9 rounded-full border-2 border-neutral-200"
                        />
                    ) : (
                        <div
                            className="w-9 h-9 rounded-full bg-primary-red flex items-center justify-center text-white text-sm font-semibold"
                            aria-hidden="true"
                        >
                          {session?.user?.name?.charAt(0) || "U"}
                        </div>
                    )}
                  </>
              ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" size="sm">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/signup">
                      <Button size="sm">Start Free Trial</Button>
                    </Link>
                  </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                  <X className="w-6 h-6 text-neutral-700" aria-hidden="true" />
              ) : (
                  <Menu className="w-6 h-6 text-neutral-700" aria-hidden="true" />
              )}
            </button>
          </nav>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
              <div className="md:hidden mt-4 pb-4 border-t border-neutral-200 pt-4 animate-fade-in">
                <div className="flex flex-col gap-4">
                  {navLinks.map((link) => (
                      <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="text-neutral-600 hover:text-neutral-900 font-medium py-2 transition-colors"
                      >
                        {link.label}
                      </Link>
                  ))}
                  <div className="flex flex-col gap-2 pt-4 border-t border-neutral-200">
                    {isSignedIn ? (
                        <Link href="/dashboard">
                          <Button className="w-full">Dashboard</Button>
                        </Link>
                    ) : (
                        <>
                          <Link href="/login">
                            <Button variant="outline" className="w-full">
                              Sign In
                            </Button>
                          </Link>
                          <Link href="/signup">
                            <Button className="w-full">Start Free Trial</Button>
                          </Link>
                        </>
                    )}
                  </div>
                </div>
              </div>
          )}
        </div>
      </header>
  );
}