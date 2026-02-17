// src/app/api/content/campaigns/[id]/publish-blog/route.ts
// API route for publishing campaign web blog content to the marketing blog

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import { auth } from "@/lib/auth";
import { getCampaignSession } from "@/lib/services/content-campaigns";
import { getContentImageById } from "@/lib/services/content-images";
import { downloadFileFromGCS } from "@/lib/gcs";
import { logErrorToFeedback } from "@/lib/services/error-logger";
import { resolveAuthor, fetchUserSettings, resolveBlogPaths } from "@/lib/services/campaign-prompts";

interface RouteParams {
    params: Promise<{ id: string }>;
}

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 80);
}

export async function POST(request: NextRequest, { params }: RouteParams) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id } = await params;
        const userId = session.user.id;

        // Validate campaign exists and belongs to user
        const campaign = getCampaignSession(id, userId);
        if (!campaign) {
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
        }

        const body = await request.json();
        const { title, content, description, category, tags, heroImageId, pubDate: customPubDate } = body as {
            title: string;
            content: string;
            description?: string;
            category?: string;
            tags?: string[];
            heroImageId?: string;
            pubDate?: string; // YYYY-MM-DD format, defaults to today
        };

        // Validate required fields
        if (!title || !content) {
            return NextResponse.json(
                { error: "Title and content are required" },
                { status: 400 }
            );
        }

        // Resolve publishing directories from user settings
        const settings = await fetchUserSettings(userId);
        const { contentDir: CONTENT_DIR, imagesDir: BLOG_IMAGES_DIR } = resolveBlogPaths(settings);

        // Generate slug and check for duplicates
        const slug = generateSlug(title);
        if (!slug) {
            return NextResponse.json(
                { error: "Could not generate a valid URL slug from the title" },
                { status: 400 }
            );
        }

        // Check for duplicate slugs in the target content directory
        if (fs.existsSync(CONTENT_DIR)) {
            const existingSlugs = fs.readdirSync(CONTENT_DIR)
                .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
                .map((f) => f.replace(/\.mdx?$/, ""));

            if (existingSlugs.includes(slug)) {
                return NextResponse.json(
                    { error: "A blog post with this title already exists", slug },
                    { status: 409 }
                );
            }
        }

        const targetPath = path.join(CONTENT_DIR, `${slug}.md`);

        // Handle hero image: download from GCS to public/images/blog/
        let heroImageRef = "";

        if (heroImageId) {
            try {
                const image = await getContentImageById(heroImageId, userId);
                if (image && image.gcsPath) {
                    // Ensure blog images directory exists
                    if (!fs.existsSync(BLOG_IMAGES_DIR)) {
                        fs.mkdirSync(BLOG_IMAGES_DIR, { recursive: true });
                    }

                    const extension = image.gcsPath.match(/\.(png|jpg|jpeg|webp|gif)$/i)?.[0] || ".png";
                    const imageFileName = `${slug}${extension}`;
                    const localPath = path.join(BLOG_IMAGES_DIR, imageFileName);

                    await downloadFileFromGCS(image.gcsPath, localPath);
                    heroImageRef = `/images/blog/${imageFileName}`;

                    console.log(`[Publish Blog] Hero image saved to ${localPath}`);
                }
            } catch (imageError: unknown) {
                // Non-fatal: publish blog without hero image
                console.error("[Publish Blog] Hero image download failed:", imageError);
                logErrorToFeedback({
                    userId,
                    source: "campaign-publish-blog-image",
                    error: imageError,
                    metadata: { campaignId: id, heroImageId },
                });
            }
        }

        // Strip any AI-generated frontmatter from content
        let cleanContent = content;
        const frontmatterRegex = /^---\n[\s\S]*?\n---\n*/;
        cleanContent = cleanContent.replace(frontmatterRegex, "").trim();

        // Resolve author from campaign brief (settings already fetched above)
        const author = resolveAuthor(campaign.brief.authorId, session, settings);

        // Build frontmatter matching the existing blog format
        // Use custom publication date if provided, otherwise default to today
        const pubDate = customPubDate && /^\d{4}-\d{2}-\d{2}$/.test(customPubDate)
            ? customPubDate
            : new Date().toISOString().split("T")[0];
        const escapedTitle = title.replace(/"/g, '\\"');
        const escapedDescription = (description || "").replace(/"/g, '\\"');
        const blogCategory = category || "Technology";

        const frontmatter = [
            "---",
            `title: "${escapedTitle}"`,
            `description: "${escapedDescription}"`,
            `pubDate: ${pubDate}`,
            `heroImage: "${heroImageRef}"`,
            `category: "${blogCategory}"`,
            "author:",
            `  name: "${author.name.replace(/"/g, '\\"')}"`,
            `  role: "${(author.role || "").replace(/"/g, '\\"')}"`,
            `  image: "${author.image || "/images/founder.jpg"}"`,
            "featured: false",
            "---",
        ].join("\n");

        const fileContent = `${frontmatter}\n\n${cleanContent}\n`;

        // Ensure content directory exists
        if (!fs.existsSync(CONTENT_DIR)) {
            fs.mkdirSync(CONTENT_DIR, { recursive: true });
        }

        // Write the markdown file
        fs.writeFileSync(targetPath, fileContent, "utf-8");
        console.log(`[Publish Blog] Blog post published: ${targetPath}`);

        // Revalidate blog pages for ISR cache busting
        revalidatePath("/blog");
        revalidatePath(`/blog/${slug}`);

        return NextResponse.json({
            success: true,
            slug,
            url: `/blog/${slug}`,
            heroImagePath: heroImageRef,
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to publish blog post";
        console.error("[Publish Blog] Error:", error);

        // Try to get userId for error logging
        try {
            const session = await auth();
            if (session?.user?.id) {
                logErrorToFeedback({
                    userId: session.user.id,
                    source: "campaign-publish-blog",
                    error,
                    metadata: {},
                });
            }
        } catch {
            // Ignore logging failures
        }

        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
