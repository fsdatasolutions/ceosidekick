// src/lib/github.ts
// GitHub API service for publishing blog content directly to a repository.
// Uses the GitHub Contents API and Git Trees/Commits API via fetch().

const GITHUB_API = "https://api.github.com";

interface GitHubFileInput {
    path: string;           // e.g. "src/content/blog/my-post.md"
    content: string | Buffer; // text content or binary buffer
    encoding?: "utf-8" | "base64";
}

interface GitHubCommitResult {
    sha: string;
    url: string;
}

/** Common headers for GitHub API requests. */
function headers(token: string) {
    return {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
    };
}

/** Throw a descriptive error if a GitHub API response is not ok. */
async function assertOk(res: Response, action: string) {
    if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
            `GitHub API error (${action}): ${res.status} ${res.statusText} — ${body}`
        );
    }
}

/**
 * Check whether a file already exists at the given path in the repo.
 * Returns the file SHA if it exists, or null if it doesn't.
 */
export async function checkFileExists(
    token: string,
    repo: string,
    branch: string,
    filePath: string
): Promise<string | null> {
    const url = `${GITHUB_API}/repos/${repo}/contents/${filePath}?ref=${branch}`;
    const res = await fetch(url, { headers: headers(token) });

    if (res.status === 404) return null;
    if (!res.ok) {
        await assertOk(res, `check file ${filePath}`);
    }

    const data = await res.json();
    return data.sha ?? null;
}

/**
 * Commit one or more files to a GitHub repository in a single commit.
 * Uses the low-level Git Trees + Commits API so we can bundle multiple
 * files (e.g. a .md blog post + hero image) into one atomic commit.
 */
export async function commitFilesToGitHub(
    token: string,
    repo: string,
    branch: string,
    files: GitHubFileInput[],
    commitMessage: string
): Promise<GitHubCommitResult> {
    const hdrs = headers(token);

    // 1. Get the latest commit SHA on the branch
    const refRes = await fetch(
        `${GITHUB_API}/repos/${repo}/git/ref/heads/${branch}`,
        { headers: hdrs }
    );
    await assertOk(refRes, "get branch ref");
    const refData = await refRes.json();
    const latestCommitSha: string = refData.object.sha;

    // 2. Get the tree SHA of that commit
    const commitRes = await fetch(
        `${GITHUB_API}/repos/${repo}/git/commits/${latestCommitSha}`,
        { headers: hdrs }
    );
    await assertOk(commitRes, "get latest commit");
    const commitData = await commitRes.json();
    const baseTreeSha: string = commitData.tree.sha;

    // 3. Create blobs for each file
    const treeItems = await Promise.all(
        files.map(async (file) => {
            const isBuffer = Buffer.isBuffer(file.content);
            const blobRes = await fetch(
                `${GITHUB_API}/repos/${repo}/git/blobs`,
                {
                    method: "POST",
                    headers: hdrs,
                    body: JSON.stringify({
                        content: isBuffer
                            ? (file.content as Buffer).toString("base64")
                            : file.content,
                        encoding: isBuffer ? "base64" : "utf-8",
                    }),
                }
            );
            await assertOk(blobRes, `create blob for ${file.path}`);
            const blobData = await blobRes.json();

            return {
                path: file.path,
                mode: "100644" as const,
                type: "blob" as const,
                sha: blobData.sha as string,
            };
        })
    );

    // 4. Create a new tree with the blobs
    const treeRes = await fetch(
        `${GITHUB_API}/repos/${repo}/git/trees`,
        {
            method: "POST",
            headers: hdrs,
            body: JSON.stringify({
                base_tree: baseTreeSha,
                tree: treeItems,
            }),
        }
    );
    await assertOk(treeRes, "create tree");
    const treeData = await treeRes.json();

    // 5. Create a new commit pointing to the new tree
    const newCommitRes = await fetch(
        `${GITHUB_API}/repos/${repo}/git/commits`,
        {
            method: "POST",
            headers: hdrs,
            body: JSON.stringify({
                message: commitMessage,
                tree: treeData.sha,
                parents: [latestCommitSha],
            }),
        }
    );
    await assertOk(newCommitRes, "create commit");
    const newCommitData = await newCommitRes.json();

    // 6. Update the branch ref to point to the new commit
    const updateRefRes = await fetch(
        `${GITHUB_API}/repos/${repo}/git/refs/heads/${branch}`,
        {
            method: "PATCH",
            headers: hdrs,
            body: JSON.stringify({
                sha: newCommitData.sha,
            }),
        }
    );
    await assertOk(updateRefRes, "update branch ref");

    return {
        sha: newCommitData.sha,
        url: newCommitData.html_url,
    };
}

/**
 * List existing blog file slugs in the repo's blog content directory.
 * Used for duplicate slug detection.
 */
export async function listExistingSlugs(
    token: string,
    repo: string,
    branch: string,
    blogPath: string
): Promise<string[]> {
    const url = `${GITHUB_API}/repos/${repo}/contents/${blogPath}?ref=${branch}`;
    const res = await fetch(url, { headers: headers(token) });

    if (res.status === 404) return []; // directory doesn't exist yet
    await assertOk(res, `list files in ${blogPath}`);

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data
        .filter((f: { name: string }) => f.name.endsWith(".md") || f.name.endsWith(".mdx"))
        .map((f: { name: string }) => f.name.replace(/\.mdx?$/, ""));
}
