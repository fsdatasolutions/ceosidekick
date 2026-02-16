import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostsByAuthor } from "@/lib/blog";
import { getAuthor, getAllAuthors } from "@/lib/blog-authors";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateStaticParams() {
  const authors = getAllAuthors();
  return authors.map((author) => ({ author: author.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ author: string }>;
}): Promise<Metadata> {
  const { author: authorId } = await params;
  const author = getAuthor(authorId);

  if (!author) return { title: "Author Not Found" };

  return {
    title: `${author.name} — Articles`,
    description: `Read articles by ${author.name}, ${author.role} at CEO Sidekick.`,
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ author: string }>;
}) {
  const { author: authorId } = await params;
  const author = getAuthor(authorId);

  if (!author) notFound();

  const posts = getPostsByAuthor(author.name);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative pt-32 pb-16 sm:pt-40 sm:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-red mb-6">
            Author
          </p>
          {author.image && (
            <Image
              src={author.image}
              alt={author.name}
              width={96}
              height={96}
              className="w-24 h-24 rounded-full object-cover mx-auto mb-6 border-2 border-neutral-200"
            />
          )}
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 mb-2">
            {author.name}
          </h1>
          <p className="text-lg text-primary-red font-medium mb-4">
            {author.role}
          </p>
          {author.bio && (
            <p className="text-neutral-500 text-lg max-w-2xl mx-auto leading-relaxed mb-4">
              {author.bio}
            </p>
          )}
          <p className="text-sm text-neutral-400">
            {posts.length} {posts.length === 1 ? "article" : "articles"}
          </p>
        </div>
      </section>

      {/* Post Grid */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-neutral-500 text-lg">
                No articles by this author yet.
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
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-neutral-400">
                            {formatDate(post.pubDate)}
                          </span>
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
