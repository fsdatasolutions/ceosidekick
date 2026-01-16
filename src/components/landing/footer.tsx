"use client";

import Link from "next/link";
import { Sparkles, Twitter, Linkedin, Github } from "lucide-react";

const footerLinks = {
  product: {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "AI Advisors", href: "#agents" },
      { label: "Pricing", href: "#pricing" },
      { label: "Content Engine", href: "https://ce.ceosidekick.biz" },
      { label: "Roadmap", href: "#" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Case Studies", href: "#" },
      { label: "Help Center", href: "#" },
      { label: "API (Coming Soon)", href: "#" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { label: "About", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
      { label: "Partners", href: "#" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Cookie Policy", href: "#" },
      { label: "Security", href: "#" },
    ],
  },
};

const socialLinks = [
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Github, href: "#", label: "GitHub" },
];

export function Footer() {
  return (
    <footer className="bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-16">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg shadow-primary-red/20 group-hover:shadow-xl group-hover:shadow-primary-red/30 transition-all duration-200">
                  <img
                      src="/images/robin-logo.png"
                      alt="CEO SideKick"
                      className="w-6 h-6 object-contain"
                  />
                </div>
                <div>
                  <span className="font-display font-bold text-xl text-white">
                    CEO Sidekick
                  </span>
                </div>
              </Link>
              <p className="text-neutral-400 text-sm leading-relaxed mb-6 max-w-xs">
                Your AI-powered C-suite. On-demand access to executive-level guidance 
                across strategy, technology, legal, HR, and more.
              </p>
              <div className="flex gap-4">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5 text-neutral-400" />
                  </a>
                ))}
              </div>
            </div>

            {/* Link Columns */}
            {Object.entries(footerLinks).map(([key, section]) => (
              <div key={key}>
                <h3 className="font-semibold text-white mb-4">{section.title}</h3>
                <ul className="space-y-3">
                  {section.links.map((link, index) => (
                    <li key={index}>
                      <Link
                        href={link.href}
                        className="text-sm text-neutral-400 hover:text-white transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-neutral-500">
              © {new Date().getFullYear()} Full Stack Data Solutions. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <span className="text-xs text-neutral-600">
                Built with ❤️ for entrepreneurs
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
