// src/lib/services/content-items.ts
// Database service for content items (articles, posts, blogs)

import { db } from "@/db";
import { contentItems, contentVersions } from "@/db/schema";
import { eq, and, desc, count, asc } from "drizzle-orm";
import type { ContentItem, ContentVersion } from "@/db/schema";

export type ContentType = "linkedin_article" | "linkedin_post" | "web_blog";
export type ContentStatus = "draft" | "published" | "archived";

export interface CreateContentInput {
    userId: string;
    organizationId?: string;
    type: ContentType;
    title?: string;
    content?: string;
    description?: string;
    heroImageId?: string;
    category?: string;
    tags?: string[];
    featured?: boolean;
    linkedinPostType?: string;
    authorName?: string;
    authorRole?: string;
    authorImageUrl?: string;
    generatedFromPrompt?: string;
    aiModel?: string;
}

export interface UpdateContentInput {
    title?: string;
    content?: string;
    description?: string;
    heroImageId?: string | null;
    category?: string;
    tags?: string[];
    featured?: boolean;
    status?: ContentStatus;
    linkedinPostType?: string;
    authorName?: string;
    authorRole?: string;
    authorImageUrl?: string;
    publishedAt?: Date | null;
    scheduledFor?: Date | null;
}

export interface ListContentOptions {
    userId: string;
    organizationId?: string;
    type?: ContentType;
    status?: ContentStatus;
    limit?: number;
    offset?: number;
}

export interface ListContentResult {
    items: ContentItem[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}

export interface CreateVersionInput {
    contentItemId: string;
    versionLabel?: string;
    changeNotes?: string;
    createdBy: string;
}

// ============================================
// CONTENT ITEM OPERATIONS
// ============================================

/**
 * Create a new content item
 */
export async function createContentItem(input: CreateContentInput): Promise<ContentItem> {
    const [item] = await db
        .insert(contentItems)
        .values({
            userId: input.userId,
            organizationId: input.organizationId,
            type: input.type,
            status: "draft",
            title: input.title,
            content: input.content,
            description: input.description,
            heroImageId: input.heroImageId,
            category: input.category,
            tags: input.tags,
            featured: input.featured ?? false,
            linkedinPostType: input.linkedinPostType,
            authorName: input.authorName,
            authorRole: input.authorRole,
            authorImageUrl: input.authorImageUrl,
            generatedFromPrompt: input.generatedFromPrompt,
            aiModel: input.aiModel,
        })
        .returning();

    return item;
}

/**
 * Get a content item by ID
 */
export async function getContentItemById(
    itemId: string,
    userId: string
): Promise<ContentItem | null> {
    const [item] = await db
        .select()
        .from(contentItems)
        .where(
            and(
                eq(contentItems.id, itemId),
                eq(contentItems.userId, userId)
            )
        )
        .limit(1);

    return item || null;
}

/**
 * List content items for a user
 */
export async function listContentItems(
    options: ListContentOptions
): Promise<ListContentResult> {
    const { userId, organizationId, type, status, limit = 20, offset = 0 } = options;

    // Build where conditions
    const conditions = [eq(contentItems.userId, userId)];
    
    if (organizationId) {
        conditions.push(eq(contentItems.organizationId, organizationId));
    }
    
    if (type) {
        conditions.push(eq(contentItems.type, type));
    }

    if (status) {
        conditions.push(eq(contentItems.status, status));
    }

    // Get items with pagination
    const items = await db
        .select()
        .from(contentItems)
        .where(and(...conditions))
        .orderBy(desc(contentItems.updatedAt))
        .limit(limit)
        .offset(offset);

    // Get total count
    const [countResult] = await db
        .select({ count: count() })
        .from(contentItems)
        .where(and(...conditions));

    const total = countResult?.count ?? 0;

    return {
        items,
        pagination: {
            total,
            limit,
            offset,
            hasMore: offset + items.length < total,
        },
    };
}

/**
 * Update a content item
 */
export async function updateContentItem(
    itemId: string,
    userId: string,
    updates: UpdateContentInput
): Promise<ContentItem | null> {
    const [item] = await db
        .update(contentItems)
        .set({
            ...updates,
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(contentItems.id, itemId),
                eq(contentItems.userId, userId)
            )
        )
        .returning();

    return item || null;
}

/**
 * Delete a content item
 */
export async function deleteContentItem(
    itemId: string,
    userId: string
): Promise<ContentItem | null> {
    const [item] = await db
        .delete(contentItems)
        .where(
            and(
                eq(contentItems.id, itemId),
                eq(contentItems.userId, userId)
            )
        )
        .returning();

    return item || null;
}

/**
 * Publish a content item
 */
export async function publishContentItem(
    itemId: string,
    userId: string
): Promise<ContentItem | null> {
    const [item] = await db
        .update(contentItems)
        .set({
            status: "published",
            publishedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(contentItems.id, itemId),
                eq(contentItems.userId, userId)
            )
        )
        .returning();

    return item || null;
}

/**
 * Archive a content item
 */
export async function archiveContentItem(
    itemId: string,
    userId: string
): Promise<ContentItem | null> {
    const [item] = await db
        .update(contentItems)
        .set({
            status: "archived",
            updatedAt: new Date(),
        })
        .where(
            and(
                eq(contentItems.id, itemId),
                eq(contentItems.userId, userId)
            )
        )
        .returning();

    return item || null;
}

// ============================================
// VERSION OPERATIONS
// ============================================

/**
 * Create a new version (milestone) for a content item
 */
export async function createContentVersion(
    input: CreateVersionInput
): Promise<ContentVersion | null> {
    // Get the content item
    const [item] = await db
        .select()
        .from(contentItems)
        .where(eq(contentItems.id, input.contentItemId))
        .limit(1);

    if (!item) {
        return null;
    }

    // Get the next version number
    const [lastVersion] = await db
        .select({ versionNumber: contentVersions.versionNumber })
        .from(contentVersions)
        .where(eq(contentVersions.contentItemId, input.contentItemId))
        .orderBy(desc(contentVersions.versionNumber))
        .limit(1);

    const nextVersionNumber = (lastVersion?.versionNumber ?? 0) + 1;

    // Create the version snapshot
    const [version] = await db
        .insert(contentVersions)
        .values({
            contentItemId: input.contentItemId,
            versionNumber: nextVersionNumber,
            versionLabel: input.versionLabel,
            title: item.title,
            content: item.content,
            description: item.description,
            category: item.category,
            tags: item.tags,
            heroImageId: item.heroImageId,
            changeNotes: input.changeNotes,
            createdBy: input.createdBy,
        })
        .returning();

    // Update the content item's current version reference
    await db
        .update(contentItems)
        .set({
            currentVersionId: version.id,
            updatedAt: new Date(),
        })
        .where(eq(contentItems.id, input.contentItemId));

    return version;
}

/**
 * Get all versions for a content item
 */
export async function getContentVersions(
    contentItemId: string,
    userId: string
): Promise<ContentVersion[]> {
    // First verify the user owns the content item
    const [item] = await db
        .select()
        .from(contentItems)
        .where(
            and(
                eq(contentItems.id, contentItemId),
                eq(contentItems.userId, userId)
            )
        )
        .limit(1);

    if (!item) {
        return [];
    }

    // Get all versions
    const versions = await db
        .select()
        .from(contentVersions)
        .where(eq(contentVersions.contentItemId, contentItemId))
        .orderBy(desc(contentVersions.versionNumber));

    return versions;
}

/**
 * Get a specific version
 */
export async function getContentVersion(
    versionId: string,
    userId: string
): Promise<ContentVersion | null> {
    // Join with content items to verify ownership
    const [version] = await db
        .select({
            version: contentVersions,
        })
        .from(contentVersions)
        .innerJoin(contentItems, eq(contentVersions.contentItemId, contentItems.id))
        .where(
            and(
                eq(contentVersions.id, versionId),
                eq(contentItems.userId, userId)
            )
        )
        .limit(1);

    return version?.version || null;
}

/**
 * Restore a content item to a previous version
 */
export async function restoreContentVersion(
    versionId: string,
    userId: string
): Promise<ContentItem | null> {
    // Get the version with ownership check
    const version = await getContentVersion(versionId, userId);

    if (!version) {
        return null;
    }

    // Update the content item with the version's content
    const [item] = await db
        .update(contentItems)
        .set({
            title: version.title,
            content: version.content,
            description: version.description,
            category: version.category,
            tags: version.tags,
            heroImageId: version.heroImageId,
            currentVersionId: version.id,
            updatedAt: new Date(),
        })
        .where(eq(contentItems.id, version.contentItemId))
        .returning();

    return item || null;
}
