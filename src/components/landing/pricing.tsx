"use client";

import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getTiersForLandingPage } from "@/lib/tiers";

export function Pricing() {
  const plans = getTiersForLandingPage();

  return (
      <section id="pricing" className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-primary-red font-semibold text-sm uppercase tracking-wide mb-3">
              Simple Pricing
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
              Choose the plan that fits your business
            </h2>
            <p className="text-lg text-neutral-600">
              Start free, upgrade when you&apos;re ready. All plans include access to every AI advisor.
            </p>
          </div>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {plans.map((plan, index) => (
                <div
                    key={index}
                    className={cn(
                        "relative bg-white rounded-2xl border overflow-hidden transition-all duration-300",
                        plan.comingSoon
                            ? "border-dashed border-neutral-300 bg-neutral-50"
                            : plan.popular
                                ? "border-primary-red shadow-xl scale-105 lg:scale-110 z-10"
                                : "border-neutral-200 hover:border-neutral-300 hover:shadow-lg"
                    )}
                >
                  {/* Popular Badge */}
                  {plan.popular && !plan.comingSoon && (
                      <div className="absolute top-0 left-0 right-0 bg-primary-red text-white text-center py-1.5 text-sm font-semibold">
                        <Sparkles className="w-4 h-4 inline-block mr-1" />
                        Most Popular
                      </div>
                  )}

                  {/* Coming Soon Badge */}
                  {plan.comingSoon && (
                      <div className="absolute top-0 left-0 right-0 bg-neutral-200 text-neutral-600 text-center py-1.5 text-sm font-semibold">
                        Coming Soon
                      </div>
                  )}

                  <div className={cn("p-6", (plan.popular || plan.comingSoon) && "pt-12")}>
                    {/* Plan Name */}
                    <h3 className={cn(
                        "font-display text-xl font-bold mb-1",
                        plan.comingSoon ? "text-neutral-400" : "text-neutral-900"
                    )}>
                      {plan.name}
                    </h3>
                    <p className={cn(
                        "text-sm mb-4",
                        plan.comingSoon ? "text-neutral-400" : "text-neutral-500"
                    )}>
                      {plan.description}
                    </p>

                    {/* Price */}
                    <div className="mb-6">
                  <span className={cn(
                      "font-display text-4xl font-bold",
                      plan.comingSoon ? "text-neutral-400" : "text-neutral-900"
                  )}>
                    {plan.price}
                  </span>
                      <span className={cn(
                          plan.comingSoon ? "text-neutral-400" : "text-neutral-500"
                      )}>
                    {plan.period}
                  </span>
                    </div>

                    {/* CTA */}
                    <Link href={plan.comingSoon ? "#" : "/signup"}>
                      <Button
                          variant={plan.ctaVariant}
                          className={cn(
                              "w-full mb-6",
                              plan.popular && !plan.comingSoon && "animate-pulse-glow"
                          )}
                          disabled={plan.comingSoon}
                      >
                        {plan.cta}
                      </Button>
                    </Link>

                    {/* Features */}
                    <div className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                          <div
                              key={featureIndex}
                              className="flex items-start gap-3 text-sm"
                          >
                            <Check className={cn(
                                "w-5 h-5 flex-shrink-0 mt-0.5",
                                plan.comingSoon ? "text-neutral-400" : "text-success"
                            )} />
                            <span className={cn(
                                plan.comingSoon ? "text-neutral-400" : "text-neutral-600"
                            )}>
                        {feature}
                      </span>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>
            ))}
          </div>

          {/* FAQ Preview */}
          <div className="mt-16 text-center">
            <p className="text-neutral-600 mb-4">
              Have questions about pricing?{" "}
              <a href="#" className="text-primary-red font-semibold hover:underline">
                View FAQ
              </a>
            </p>
            <p className="text-sm text-neutral-500">
              All plans include a 14-day free trial. No credit card required.
            </p>
          </div>
        </div>
      </section>
  );
}