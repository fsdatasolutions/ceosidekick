import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAllPosts, getFeaturedPosts, BLOG_CATEGORIES } from "@/lib/blog";
import BlogSearch from "./blog-search";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights, strategies, and practical advice for entrepreneurs and small business owners leveraging AI to grow their businesses.",
};

export default function BlogPage() {
  const allPosts = getAllPosts();
  const featuredPosts = getFeaturedPosts().slice(0, 2);
  const categories = [...BLOG_CATEGORIES];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-red mb-4">
            Blog
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-900 mb-6">
            Insights for entrepreneurs
          </h1>
          <p className="text-lg sm:text-xl text-neutral-500 max-w-2xl mx-auto leading-relaxed">
            Practical strategies and expert perspectives on AI, leadership,
            marketing, and technology for growing businesses.
          </p>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="pb-16 sm:pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-2xl font-bold text-neutral-900 mb-8">
              Featured
            </h2>
            <div className="grid gap-8">
              {featuredPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block"
                >
                  <article className="grid md:grid-cols-2 gap-6 rounded-2xl border border-neutral-200 bg-white overflow-hidden transition-all duration-200 hover:border-neutral-300 hover:shadow-sm">
                    {post.heroImage && (
                      <div className="aspect-video md:aspect-auto overflow-hidden">
                        <Image
                          src={post.heroImage}
                          alt={post.title}
                          width={800}
                          height={450}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="flex flex-col justify-center p-6 md:p-8">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary-red">
                          {post.category}
                        </span>
                        <span className="text-neutral-300">|</span>
                        <span className="text-xs text-neutral-400">
                          {post.readingTime}
                        </span>
                      </div>
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-neutral-900 mb-3 transition-colors duration-200 group-hover:text-primary-red">
                        {post.title}
                      </h3>
                      <p className="text-neutral-500 leading-relaxed mb-6 line-clamp-3">
                        {post.description}
                      </p>
                      <div className="flex items-center gap-3">
                        {post.author.image && (
                          <Image
                            src={post.author.image}
                            alt={post.author.name}
                            width={36}
                            height={36}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-neutral-700">
                            {post.author.name}
                          </span>
                          <span className="text-neutral-300">&middot;</span>
                          <span className="text-neutral-400">
                            {formatDate(post.pubDate)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Posts with Search */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-neutral-900 mb-8">
            All Articles
          </h2>
          <BlogSearch posts={allPosts} categories={categories} />
        </div>
      </section>
    </div>
  );
}
