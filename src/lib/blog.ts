import fs from "fs";
import path from "path";
import matter from "gray-matter";

export const BLOG_CATEGORIES = [
  "Artificial Intelligence",
  "Marketing",
  "Technology",
  "Leadership",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  pubDate: string;
  heroImage: string;
  category: BlogCategory;
  author: {
    name: string;
    role: string;
    image: string;
  };
  featured: boolean;
  readingTime: string;
}

export interface BlogPost extends BlogPostMeta {
  content: string;
}

const CONTENT_DIR = path.join(process.cwd(), "src/content/blog");

function calculateReadingTime(content: string): string {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return `${minutes} min read`;
}

function parsePost(slug: string, fileContent: string): BlogPost {
  const { data, content } = matter(fileContent);

  return {
    slug,
    title: data.title,
    description: data.description,
    pubDate: new Date(data.pubDate).toISOString(),
    heroImage: data.heroImage || "",
    category: data.category as BlogCategory,
    author: {
      name: data.author?.name || "CEO Sidekick",
      role: data.author?.role || "",
      image: data.author?.image || "",
    },
    featured: data.featured || false,
    readingTime: calculateReadingTime(content),
    content,
  };
}

export function getAllPosts(): BlogPostMeta[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));

  const posts = files.map((filename) => {
    const slug = filename.replace(/\.mdx?$/, "");
    const filePath = path.join(CONTENT_DIR, filename);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const post = parsePost(slug, fileContent);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { content, ...meta } = post;
    return meta;
  });

  return posts.sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  const mdPath = path.join(CONTENT_DIR, `${slug}.md`);
  const mdxPath = path.join(CONTENT_DIR, `${slug}.mdx`);

  let filePath: string | undefined;
  if (fs.existsSync(mdPath)) filePath = mdPath;
  else if (fs.existsSync(mdxPath)) filePath = mdxPath;

  if (!filePath) return undefined;

  const fileContent = fs.readFileSync(filePath, "utf-8");
  return parsePost(slug, fileContent);
}

export function getPostsByCategory(category: BlogCategory): BlogPostMeta[] {
  return getAllPosts().filter((post) => post.category === category);
}

export function getPostsByAuthor(authorName: string): BlogPostMeta[] {
  return getAllPosts().filter(
    (post) => post.author.name.toLowerCase() === authorName.toLowerCase()
  );
}

export function getFeaturedPosts(): BlogPostMeta[] {
  return getAllPosts().filter((post) => post.featured);
}

export function getAllCategories(): BlogCategory[] {
  const posts = getAllPosts();
  const categories = new Set(posts.map((post) => post.category));
  return Array.from(categories) as BlogCategory[];
}

export function getAllSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx?$/, ""));
}
