import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostsByCategory, type BlogCategory } from "@/lib/blog";

const CATEGORY_MAP: Record<string, BlogCategory> = {
  "artificial-intelligence": "Artificial Intelligence",
  marketing: "Marketing",
  technology: "Technology",
  leadership: "Leadership",
};

const ALL_CATEGORY_SLUGS = Object.keys(CATEGORY_MAP);

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function categorySlugFromName(category: string): string {
  return category.toLowerCase().replace(/\s+/g, "-");
}

export async function generateStaticParams() {
  return ALL_CATEGORY_SLUGS.map((category) => ({ category }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const categoryName = CATEGORY_MAP[category];

  if (!categoryName) return { title: "Category Not Found" };

  return {
    title: `${categoryName} Articles`,
    description: `Read our latest articles about ${categoryName.toLowerCase()} for entrepreneurs and small business owners.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const categoryName = CATEGORY_MAP[category];

  if (!categoryName) notFound();

  const posts = getPostsByCategory(categoryName);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-red mb-4">
            Category
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-900 mb-6">
            {categoryName}
          </h1>
          <p className="text-lg sm:text-xl text-neutral-500 max-w-2xl mx-auto leading-relaxed">
            {posts.length} {posts.length === 1 ? "article" : "articles"} in this
            category
          </p>
        </div>
      </section>

      {/* Category Nav Pills */}
      <section className="pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 justify-center">
            <Link
              href="/blog"
              className="px-4 py-2 rounded-full text-sm font-medium bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-all duration-200"
            >
              All
            </Link>
            {ALL_CATEGORY_SLUGS.map((slug) => (
              <Link
                key={slug}
                href={`/blog/category/${slug}`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  slug === category
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {CATEGORY_MAP[slug]}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Post Grid */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-neutral-500 text-lg">
                No articles in this category yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => (
                <article key={post.slug} className="group">
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
                          <span className="text-xs font-semibold uppercase tracking-wider text-primary-red">
                            {post.category}
                          </span>
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
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
