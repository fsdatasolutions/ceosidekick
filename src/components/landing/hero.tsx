"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, CheckCircle2 } from "lucide-react";

const benefits = [
  "No credit card required",
  "50 free messages/month",
  "Access all AI advisors",
];

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 hero-pattern" />
      
      {/* Decorative Elements */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-primary-red/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-80 h-80 bg-accent-teal/5 rounded-full blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-red-light border border-primary-red/20 text-primary-red text-sm font-semibold mb-6 animate-fade-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-red opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-red"></span>
              </span>
              Now in Beta — Get Early Access
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight mb-6 animate-fade-up stagger-1">
              Your AI-Powered{" "}
              <span className="gradient-text">C-Suite</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-neutral-600 leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-up stagger-2">
              On-demand access to AI executive advisors across strategy, technology, 
              legal, HR, and more. Enterprise-grade guidance at a fraction of the cost.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8 animate-fade-up stagger-3">
              <Link href="/signup">
                <Button size="lg" className="group">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg" 
                className="group"
                onClick={() => {
                  document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Play className="w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            {/* Benefits */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start animate-fade-up stagger-4">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm text-neutral-600"
                >
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  {benefit}
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Mockup */}
          <div className="relative animate-fade-up stagger-3">
            <div className="relative">
              {/* Main Card */}
              <div className="bg-white rounded-2xl card-shadow border border-neutral-200/50 overflow-hidden">
                {/* Browser Chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-neutral-50 border-b border-neutral-200">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-white rounded-lg px-3 py-1.5 text-xs text-neutral-500 border border-neutral-200">
                      app.ceosidekick.biz
                    </div>
                  </div>
                </div>

                {/* Chat Interface Mockup */}
                <div className="p-6 space-y-4">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="bg-primary-red text-white px-4 py-3 rounded-2xl rounded-br-md max-w-xs">
                      <p className="text-sm">
                        Should I build a custom CRM or use off-the-shelf software?
                      </p>
                    </div>
                  </div>

                  {/* AI Response */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent-teal flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">SP</span>
                    </div>
                    <div className="bg-neutral-100 px-4 py-3 rounded-2xl rounded-bl-md max-w-sm">
                      <p className="text-sm text-neutral-700 mb-2">
                        Great question! Based on your company size and needs, I&apos;d recommend starting with off-the-shelf. Here&apos;s my analysis:
                      </p>
                      <div className="space-y-1.5 text-xs text-neutral-600">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-success" />
                          Lower upfront cost ($50-150/user/mo)
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-success" />
                          Faster time to value (days vs months)
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-warning" />
                          May need customization later
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Typing Indicator */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent-teal flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">SP</span>
                    </div>
                    <div className="bg-neutral-100 px-4 py-3 rounded-2xl">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Cards */}
              <div className="absolute -left-8 top-1/4 bg-white rounded-xl p-3 card-shadow border border-neutral-200/50 animate-float hidden lg:block">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-agent-coach flex items-center justify-center">
                    <span className="text-white text-xs font-bold">EC</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-900">Executive Coach</p>
                    <p className="text-[10px] text-neutral-500">Available 24/7</p>
                  </div>
                </div>
              </div>

              <div className="absolute -right-4 bottom-1/4 bg-white rounded-xl p-3 card-shadow border border-neutral-200/50 animate-float hidden lg:block" style={{ animationDelay: "1s" }}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-agent-legal flex items-center justify-center">
                    <span className="text-white text-xs font-bold">LA</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-900">Legal Advisor</p>
                    <p className="text-[10px] text-neutral-500">Contract review ready</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trusted By */}
        <div className="mt-20 pt-12 border-t border-neutral-200 animate-fade-up stagger-5">
          <p className="text-center text-sm text-neutral-500 mb-6">
            Trusted by forward-thinking entrepreneurs
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {["TechStart", "GrowthCo", "ScaleUp", "Innovate Inc", "NextGen"].map(
              (company, index) => (
                <div
                  key={index}
                  className="text-xl font-display font-bold text-neutral-400"
                >
                  {company}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
