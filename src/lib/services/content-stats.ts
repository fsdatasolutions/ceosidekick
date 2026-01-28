// src/lib/services/content-stats.ts
// Service for fetching content statistics for the dashboard

import { db } from "@/db";
import { contentItems, contentImages } from "@/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";

export interface ContentStats {
  images: number;
  linkedinArticles: number;
  linkedinPosts: number;
  webBlogs: number;
  total: number;
  recentContent: {
    id: string;
    type: string;
    title: string | null;
    status: string;
    updatedAt: Date;
  }[];
}

/**
 * Get content statistics for a user's dashboard
 */
export async function getContentStats(userId: string): Promise<ContentStats> {
  try {
    // Fetch counts and recent content in parallel
    const [
      imageCount,
      articleCount,
      postCount,
      blogCount,
      recentContent,
    ] = await Promise.all([
      // Count images
      db
        .select({ count: count() })
        .from(contentImages)
        .where(eq(contentImages.userId, userId)),

      // Count LinkedIn articles
      db
        .select({ count: count() })
        .from(contentItems)
        .where(
          and(
            eq(contentItems.userId, userId),
            eq(contentItems.type, "linkedin_article")
          )
        ),

      // Count LinkedIn posts
      db
        .select({ count: count() })
        .from(contentItems)
        .where(
          and(
            eq(contentItems.userId, userId),
            eq(contentItems.type, "linkedin_post")
          )
        ),

      // Count web blogs
      db
        .select({ count: count() })
        .from(contentItems)
        .where(
          and(
            eq(contentItems.userId, userId),
            eq(contentItems.type, "web_blog")
          )
        ),

      // Get recent content items
      db
        .select({
          id: contentItems.id,
          type: contentItems.type,
          title: contentItems.title,
          status: contentItems.status,
          updatedAt: contentItems.updatedAt,
        })
        .from(contentItems)
        .where(eq(contentItems.userId, userId))
        .orderBy(desc(contentItems.updatedAt))
        .limit(5),
    ]);

    const images = imageCount[0]?.count ?? 0;
    const linkedinArticles = articleCount[0]?.count ?? 0;
    const linkedinPosts = postCount[0]?.count ?? 0;
    const webBlogs = blogCount[0]?.count ?? 0;

    return {
      images,
      linkedinArticles,
      linkedinPosts,
      webBlogs,
      total: images + linkedinArticles + linkedinPosts + webBlogs,
      recentContent,
    };
  } catch (error) {
    console.error("[ContentStats] Failed to fetch stats:", error);
    
    // Return empty stats on error
    return {
      images: 0,
      linkedinArticles: 0,
      linkedinPosts: 0,
      webBlogs: 0,
      total: 0,
      recentContent: [],
    };
  }
}

/**
 * Get content counts by status for a specific content type
 */
export async function getContentStatusCounts(
  userId: string,
  type: "linkedin_article" | "linkedin_post" | "web_blog"
): Promise<{ draft: number; published: number; archived: number }> {
  try {
    const results = await db
      .select({
        status: contentItems.status,
        count: count(),
      })
      .from(contentItems)
      .where(
        and(
          eq(contentItems.userId, userId),
          eq(contentItems.type, type)
        )
      )
      .groupBy(contentItems.status);

    const counts = { draft: 0, published: 0, archived: 0 };
    
    for (const row of results) {
      if (row.status in counts) {
        counts[row.status as keyof typeof counts] = row.count;
      }
    }

    return counts;
  } catch (error) {
    console.error("[ContentStats] Failed to fetch status counts:", error);
    return { draft: 0, published: 0, archived: 0 };
  }
}
