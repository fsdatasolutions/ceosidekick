// src/app/api/content/campaigns/[id]/publish-blog/route.ts
// API route for publishing campaign web blog content.
// Supports GitHub API publishing (production) and local filesystem (dev fallback).

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import { auth } from "@/lib/auth";
import { getCampaignSession } from "@/lib/services/content-campaigns";
import { getContentImageById } from "@/lib/services/content-images";
import { downloadFileFromGCS, downloadBufferFromGCS } from "@/lib/gcs";
import { logErrorToFeedback } from "@/lib/services/error-logger";
import { resolveAuthor, fetchUserSettings, resolveBlogPaths, resolveGitHubConfig } from "@/lib/services/campaign-prompts";
import { commitFilesToGitHub, listExistingSlugs } from "@/lib/github";

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
            pubDate?: string;
        };

        if (!title || !content) {
            return NextResponse.json(
                { error: "Title and content are required" },
                { status: 400 }
            );
        }

        // Fetch user settings
        const settings = await fetchUserSettings(userId);
        const ghConfig = resolveGitHubConfig(settings);

        // Generate slug
        const slug = generateSlug(title);
        if (!slug) {
            return NextResponse.json(
                { error: "Could not generate a valid URL slug from the title" },
                { status: 400 }
            );
        }

        // Strip any AI-generated frontmatter from content
        let cleanContent = content;
        const frontmatterRegex = /^---\n[\s\S]*?\n---\n*/;
        cleanContent = cleanContent.replace(frontmatterRegex, "").trim();

        // Resolve author from campaign brief
        const author = resolveAuthor(campaign.brief.authorId, session, settings);

        // Common frontmatter fields
        const pubDate = customPubDate && /^\d{4}-\d{2}-\d{2}$/.test(customPubDate)
            ? customPubDate
            : new Date().toISOString().split("T")[0];
        const escapedTitle = title.replace(/"/g, '\\"');
        const escapedDescription = (description || "").replace(/"/g, '\\"');
        const blogCategory = category || "Technology";

        // =============================================
        // GITHUB PUBLISHING
        // =============================================
        if (ghConfig) {
            console.log(`[Publish Blog] Publishing via GitHub to ${ghConfig.repo}/${ghConfig.branch}`);

            // Check for duplicate slug
            const existingSlugs = await listExistingSlugs(
                ghConfig.token, ghConfig.repo, ghConfig.branch, ghConfig.blogPath
            );
            if (existingSlugs.includes(slug)) {
                return NextResponse.json(
                    { error: "A blog post with this title already exists", slug },
                    { status: 409 }
                );
            }

            const filesToCommit: { path: string; content: string | Buffer }[] = [];

            // Handle hero image — download from GCS as buffer
            let heroImageRef = "";
            if (heroImageId) {
                try {
                    const image = await getContentImageById(heroImageId, userId);
                    if (image && image.gcsPath) {
                        const extension = image.gcsPath.match(/\.(png|jpg|jpeg|webp|gif)$/i)?.[0] || ".png";
                        const imageFileName = `${slug}${extension}`;
                        const imageBuffer = await downloadBufferFromGCS(image.gcsPath);

                        filesToCommit.push({
                            path: `${ghConfig.imagesPath}/${imageFileName}`,
                            content: imageBuffer,
                        });
                        heroImageRef = `/images/blog/${imageFileName}`;
                        console.log(`[Publish Blog] Hero image queued for commit: ${imageFileName}`);
                    }
                } catch (imageError: unknown) {
                    console.error("[Publish Blog] Hero image download failed:", imageError);
                    logErrorToFeedback({
                        userId,
                        source: "campaign-publish-blog-image",
                        error: imageError,
                        metadata: { campaignId: id, heroImageId },
                    });
                }
            }

            // Build markdown file
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

            filesToCommit.push({
                path: `${ghConfig.blogPath}/${slug}.md`,
                content: fileContent,
            });

            const commitResult = await commitFilesToGitHub(
                ghConfig.token,
                ghConfig.repo,
                ghConfig.branch,
                filesToCommit,
                `publish: ${title}`
            );

            console.log(`[Publish Blog] GitHub commit created: ${commitResult.sha}`);

            return NextResponse.json({
                success: true,
                slug,
                url: `/blog/${slug}`,
                heroImagePath: heroImageRef,
                publishedVia: "github",
                commitSha: commitResult.sha,
            });
        }

        // =============================================
        // LOCAL FILESYSTEM FALLBACK (development)
        // =============================================
        const { contentDir: CONTENT_DIR, imagesDir: BLOG_IMAGES_DIR } = resolveBlogPaths(settings);

        // Check for duplicate slugs
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

        // Handle hero image — download from GCS to local filesystem
        let heroImageRef = "";
        if (heroImageId) {
            try {
                const image = await getContentImageById(heroImageId, userId);
                if (image && image.gcsPath) {
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
                console.error("[Publish Blog] Hero image download failed:", imageError);
                logErrorToFeedback({
                    userId,
                    source: "campaign-publish-blog-image",
                    error: imageError,
                    metadata: { campaignId: id, heroImageId },
                });
            }
        }

        // Build frontmatter and write file
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

        if (!fs.existsSync(CONTENT_DIR)) {
            fs.mkdirSync(CONTENT_DIR, { recursive: true });
        }

        fs.writeFileSync(targetPath, fileContent, "utf-8");
        console.log(`[Publish Blog] Blog post published: ${targetPath}`);

        revalidatePath("/blog");
        revalidatePath(`/blog/${slug}`);

        return NextResponse.json({
            success: true,
            slug,
            url: `/blog/${slug}`,
            heroImagePath: heroImageRef,
            publishedVia: "filesystem",
        });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to publish blog post";
        console.error("[Publish Blog] Error:", error);

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
