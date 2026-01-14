"use client";

import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    quote:
      "CEO Sidekick has become my go-to for every strategic decision. It's like having a board of advisors available 24/7.",
    author: "Sarah Chen",
    role: "Founder",
    company: "TechStart Solutions",
    avatar: "SC",
    rating: 5,
  },
  {
    quote:
      "The Legal Advisor saved me from signing a terrible contract. It caught red flags I would have missed completely.",
    author: "Marcus Johnson",
    role: "CEO",
    company: "GrowthCo Marketing",
    avatar: "MJ",
    rating: 5,
  },
  {
    quote:
      "As a solo founder, I was wearing too many hats. Now I have expert guidance in areas where I'm weakest.",
    author: "Emily Rodriguez",
    role: "Founder",
    company: "Bloom Digital",
    avatar: "ER",
    rating: 5,
  },
  {
    quote:
      "The HR Partner helped me build our entire hiring process from scratch. Job descriptions, interview questions, everything.",
    author: "David Park",
    role: "CTO",
    company: "NextGen AI",
    avatar: "DP",
    rating: 5,
  },
  {
    quote:
      "Finally, a tool that gives real strategic advice, not generic answers. The Strategy Partner understands context.",
    author: "Lisa Thompson",
    role: "Director",
    company: "Innovate Consulting",
    avatar: "LT",
    rating: 5,
  },
  {
    quote:
      "We uploaded all our SOPs to the Knowledge Base. Now any team member can find answers instantly.",
    author: "James Wilson",
    role: "Operations Lead",
    company: "ScaleUp Agency",
    avatar: "JW",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-primary-red font-semibold text-sm uppercase tracking-wide mb-3">
            Customer Stories
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-neutral-900 mb-4">
            Loved by entrepreneurs worldwide
          </h2>
          <p className="text-lg text-neutral-600">
            See how business owners are using CEO Sidekick to make smarter decisions 
            and grow their companies.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group relative bg-neutral-50 rounded-2xl p-6 border border-neutral-200 hover:border-neutral-300 hover:bg-white hover:shadow-lg transition-all duration-300"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote className="w-12 h-12 text-primary-red" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-accent-gold fill-accent-gold"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-neutral-700 leading-relaxed mb-6 relative z-10">
                &ldquo;{testimonial.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-red flex items-center justify-center text-white text-sm font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-neutral-900 text-sm">
                    {testimonial.author}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats Banner */}
        <div className="mt-16 bg-neutral-900 rounded-2xl p-8 md:p-12">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: "500+", label: "Active Businesses" },
              { value: "50,000+", label: "Questions Answered" },
              { value: "4.9/5", label: "Average Rating" },
              { value: "98%", label: "Would Recommend" },
            ].map((stat, index) => (
              <div key={index}>
                <div className="font-display text-3xl md:text-4xl font-bold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-neutral-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
