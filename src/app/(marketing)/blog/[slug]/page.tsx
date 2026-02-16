import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getPostBySlug, getAllSlugs } from "@/lib/blog";
import { getAuthorByName } from "@/lib/blog-authors";

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

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.pubDate,
      authors: [post.author.name],
      images: post.heroImage
        ? [
            {
              url: post.heroImage,
              width: 1200,
              height: 630,
              alt: post.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: post.heroImage ? [post.heroImage] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const authorProfile = getAuthorByName(post.author.name);
  const authorId = authorProfile
    ? authorProfile.id
    : post.author.name.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="pt-32 pb-8 sm:pt-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 transition-colors duration-200 mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>

          {/* Category & reading time */}
          <div className="flex items-center gap-3 mb-4">
            <Link
              href={`/blog/category/${categorySlug(post.category)}`}
              className="text-xs font-semibold uppercase tracking-wider text-primary-red hover:text-primary-red-hover transition-colors duration-200"
            >
              {post.category}
            </Link>
            <span className="text-neutral-300">|</span>
            <span className="text-xs text-neutral-400">{post.readingTime}</span>
          </div>

          {/* Title */}
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-neutral-900 mb-8">
            {post.title}
          </h1>

          {/* Author row */}
          <div className="flex items-center gap-4 pb-8 border-b border-neutral-200">
            {post.author.image && (
              <Image
                src={post.author.image}
                alt={post.author.name}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <Link
                href={`/blog/author/${authorId}`}
                className="font-medium text-neutral-900 hover:text-primary-red transition-colors duration-200"
              >
                {post.author.name}
              </Link>
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <span>{post.author.role}</span>
                <span className="text-neutral-300">&middot;</span>
                <span>{formatDate(post.pubDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Image */}
      {post.heroImage && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="rounded-2xl overflow-hidden">
            <Image
              src={post.heroImage}
              alt={post.title}
              width={1200}
              height={630}
              className="w-full h-auto object-cover"
              priority
            />
          </div>
        </div>
      )}

      {/* Content */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="prose prose-neutral prose-lg prose-headings:font-display prose-a:text-primary-red prose-a:no-underline hover:prose-a:underline max-w-none">
          <MDXRemote source={post.content} />
        </div>
      </article>

      {/* Author Bio Card */}
      {authorProfile && (
        <section className="pb-20 sm:pb-28">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-8">
              <div className="flex items-start gap-5">
                {authorProfile.image && (
                  <Image
                    src={authorProfile.image}
                    alt={authorProfile.name}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
                    Written by
                  </p>
                  <Link
                    href={`/blog/author/${authorProfile.id}`}
                    className="font-display text-xl font-bold text-neutral-900 hover:text-primary-red transition-colors duration-200"
                  >
                    {authorProfile.name}
                  </Link>
                  <p className="text-sm text-primary-red font-medium mt-0.5">
                    {authorProfile.role}
                  </p>
                  <p className="text-neutral-600 mt-3 leading-relaxed">
                    {authorProfile.bio}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
