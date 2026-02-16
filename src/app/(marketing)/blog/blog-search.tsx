"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import type { BlogPostMeta, BlogCategory } from "@/lib/blog";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function categorySlug(category: string): string {
  return category.toLowerCase().replace(/\s+/g, "-");
}

function authorSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function PostCard({ post }: { post: BlogPostMeta }) {
  return (
    <article className="group">
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="rounded-2xl border border-neutral-200 bg-white overflow-hidden transition-all duration-200 hover:border-neutral-300 hover:shadow-sm">
          {post.heroImage && (
            <div className="aspect-video overflow-hidden">
              <Image
                src={post.heroImage}
                alt={post.title}
                width={600}
                height={338}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Link
                href={`/blog/category/${categorySlug(post.category)}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-semibold uppercase tracking-wider text-primary-red hover:text-primary-red-hover transition-colors duration-200"
              >
                {post.category}
              </Link>
              <span className="text-neutral-300">|</span>
              <span className="text-xs text-neutral-400">
                {post.readingTime}
              </span>
            </div>
            <h3 className="font-display text-lg font-bold text-neutral-900 mb-2 line-clamp-2 transition-colors duration-200 group-hover:text-primary-red">
              {post.title}
            </h3>
            <p className="text-neutral-500 text-sm leading-relaxed line-clamp-2 mb-4">
              {post.description}
            </p>
            <div className="flex items-center gap-3">
              {post.author.image && (
                <Image
                  src={post.author.image}
                  alt={post.author.name}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
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
        </div>
      </Link>
    </article>
  );
}

export default function BlogSearch({
  posts,
  categories,
}: {
  posts: BlogPostMeta[];
  categories: BlogCategory[];
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered = posts.filter((post) => {
    const matchesSearch =
      search === "" ||
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.description.toLowerCase().includes(search.toLowerCase()) ||
      post.author.name.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      activeCategory === "All" || post.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const allCategories = ["All", ...categories];

  return (
    <div>
      {/* Search & Filter */}
      <div className="mb-12">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-primary-red focus:ring-1 focus:ring-primary-red outline-none transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-neutral-500 text-lg">
            No articles found matching your search.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}

export { PostCard, formatDate, categorySlug, authorSlug };
