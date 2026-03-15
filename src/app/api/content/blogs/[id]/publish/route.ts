// src/app/api/content/blogs/[id]/publish/route.ts
// Standalone endpoint for publishing a saved blog post.
// Supports two modes:
//   1. GitHub API — commits .md + hero image to the user's website repo (production)
//   2. Local filesystem — writes to disk (development fallback)

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import { auth } from "@/lib/auth";
import { getContentItemById } from "@/lib/services/content-items";
import { getContentImageById } from "@/lib/services/content-images";
import { downloadFileFromGCS, downloadBufferFromGCS } from "@/lib/gcs";
import { fetchUserSettings, resolveBlogPaths, resolveGitHubConfig } from "@/lib/services/campaign-prompts";
import { commitFilesToGitHub, listExistingSlugs } from "@/lib/github";
import { logErrorToFeedback } from "@/lib/services/error-logger";

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

        // 1. Load the content item from DB
        const item = await getContentItemById(id, userId);
        if (!item) {
            return NextResponse.json({ error: "Blog not found" }, { status: 404 });
        }
        if (item.type !== "web_blog") {
            return NextResponse.json({ error: "Not a web blog" }, { status: 400 });
        }
        if (!item.title || !item.content) {
            return NextResponse.json(
                { error: "Blog title and content are required" },
                { status: 400 }
            );
        }

        // 2. Parse optional overrides from request body
        const body = await request.json().catch(() => ({}));
        const pubDate = (body.pubDate && /^\d{4}-\d{2}-\d{2}$/.test(body.pubDate))
            ? body.pubDate
            : new Date().toISOString().split("T")[0];

        // 3. Fetch user settings
        const settings = await fetchUserSettings(userId);
        const ghConfig = resolveGitHubConfig(settings);

        // 4. Generate slug
        const slug = generateSlug(item.title);
        if (!slug) {
            return NextResponse.json(
                { error: "Could not generate a valid URL slug from the title" },
                { status: 400 }
            );
        }

        // 5. Strip any AI-generated frontmatter from content
        let cleanContent = item.content;
        const frontmatterRegex = /^---\n[\s\S]*?\n---\n*/;
        cleanContent = cleanContent.replace(frontmatterRegex, "").trim();

        // 6. Resolve author
        const authorName = item.authorName || session.user?.name || "Author";
        const authorRole = item.authorRole || "";
        const authorImage = item.authorImageUrl || "/images/founder.jpg";

        // 7. Build frontmatter
        const escapedTitle = item.title.replace(/"/g, '\\"');
        const escapedDescription = (item.description || "").replace(/"/g, '\\"');
        const blogCategory = item.category || "Technology";

        // =============================================
        // GITHUB PUBLISHING
        // =============================================
        if (ghConfig) {
            console.log(`[Publish Blog] Publishing via GitHub to ${ghConfig.repo}/${ghConfig.branch}`);

            // Check for duplicate slug in GitHub repo
            const existingSlugs = await listExistingSlugs(
                ghConfig.token, ghConfig.repo, ghConfig.branch, ghConfig.blogPath
            );
            if (existingSlugs.includes(slug)) {
                return NextResponse.json(
                    { error: "A blog post with this title already exists", slug },
                    { status: 409 }
                );
            }

            // Prepare files to commit
            const filesToCommit: { path: string; content: string | Buffer }[] = [];

            // Handle hero image — download from GCS as buffer
            let heroImageRef = "";
            if (item.heroImageId) {
                try {
                    const image = await getContentImageById(item.heroImageId, userId);
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
                        source: "blog-publish-image",
                        error: imageError,
                        metadata: { blogId: id, heroImageId: item.heroImageId },
                    });
                }
            }

            // Build the markdown file
            const frontmatter = [
                "---",
                `title: "${escapedTitle}"`,
                `description: "${escapedDescription}"`,
                `pubDate: ${pubDate}`,
                `heroImage: "${heroImageRef}"`,
                `category: "${blogCategory}"`,
                "author:",
                `  name: "${authorName.replace(/"/g, '\\"')}"`,
                `  role: "${authorRole.replace(/"/g, '\\"')}"`,
                `  image: "${authorImage}"`,
                "featured: false",
                "---",
            ].join("\n");

            const fileContent = `${frontmatter}\n\n${cleanContent}\n`;

            filesToCommit.push({
                path: `${ghConfig.blogPath}/${slug}.md`,
                content: fileContent,
            });

            // Commit all files in a single commit
            const commitResult = await commitFilesToGitHub(
                ghConfig.token,
                ghConfig.repo,
                ghConfig.branch,
                filesToCommit,
                `publish: ${item.title}`
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
        const { contentDir, imagesDir } = resolveBlogPaths(settings);

        // Validate content directory exists
        if (!fs.existsSync(contentDir)) {
            return NextResponse.json(
                { error: `Blog content directory does not exist: ${contentDir}. Configure GitHub Publishing in Settings for production use, or create this directory for local development.` },
                { status: 400 }
            );
        }

        // Check for duplicate slug
        const existingSlugs = fs.readdirSync(contentDir)
            .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
            .map((f) => f.replace(/\.mdx?$/, ""));

        if (existingSlugs.includes(slug)) {
            return NextResponse.json(
                { error: "A blog post with this title already exists", slug },
                { status: 409 }
            );
        }

        const targetPath = path.join(contentDir, `${slug}.md`);

        // Handle hero image — download from GCS to local filesystem
        let heroImageRef = "";
        if (item.heroImageId) {
            try {
                const image = await getContentImageById(item.heroImageId, userId);
                if (image && image.gcsPath) {
                    if (!fs.existsSync(imagesDir)) {
                        fs.mkdirSync(imagesDir, { recursive: true });
                    }

                    const extension = image.gcsPath.match(/\.(png|jpg|jpeg|webp|gif)$/i)?.[0] || ".png";
                    const imageFileName = `${slug}${extension}`;
                    const localPath = path.join(imagesDir, imageFileName);

                    await downloadFileFromGCS(image.gcsPath, localPath);
                    heroImageRef = `/images/blog/${imageFileName}`;
                    console.log(`[Publish Blog] Hero image saved to ${localPath}`);
                }
            } catch (imageError: unknown) {
                console.error("[Publish Blog] Hero image download failed:", imageError);
                logErrorToFeedback({
                    userId,
                    source: "blog-publish-image",
                    error: imageError,
                    metadata: { blogId: id, heroImageId: item.heroImageId },
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
            `  name: "${authorName.replace(/"/g, '\\"')}"`,
            `  role: "${authorRole.replace(/"/g, '\\"')}"`,
            `  image: "${authorImage}"`,
            "featured: false",
            "---",
        ].join("\n");

        const fileContent = `${frontmatter}\n\n${cleanContent}\n`;

        fs.writeFileSync(targetPath, fileContent, "utf-8");
        console.log(`[Publish Blog] Blog post published: ${targetPath}`);

        // Revalidate blog pages
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
                    source: "blog-publish",
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
