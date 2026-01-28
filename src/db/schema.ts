// src/db/schema.ts - Complete schema with subscriptions and usage tracking
// CEO Sidekick Database Schema

import {
    pgTable,
    uuid,
    varchar,
    text,
    timestamp,
    boolean,
    integer,
    jsonb,
    index,
    uniqueIndex,
    customType,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================
// PGVECTOR CUSTOM TYPE
// ============================================

// Custom type for pgvector embeddings (1536 dimensions for OpenAI)
const vector = customType<{ data: number[]; driverData: string }>({
    dataType() {
        return "vector(1536)";
    },
    toDriver(value: number[]): string {
        return `[${value.join(",")}]`;
    },
    fromDriver(value: string): number[] {
        const cleaned = value.replace(/^\[/, "").replace(/\]$/, "");
        return cleaned.split(",").map(Number);
    },
});

// ============================================
// USERS & AUTH
// ============================================

export const users = pgTable(
    "users",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        email: varchar("email", { length: 255 }).notNull().unique(),
        password: varchar("password", { length: 255 }), // null for OAuth-only users
        name: varchar("name", { length: 255 }),
        image: varchar("image", { length: 500 }),
        role: text("role").default("user"),  // <-- ADD THIS LINE
        emailVerified: timestamp("email_verified"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("users_email_idx").on(table.email),
    ]
);

export const accounts = pgTable(
    "accounts",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: varchar("type", { length: 50 }).notNull(),
        provider: varchar("provider", { length: 50 }).notNull(),
        providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
        refreshToken: text("refresh_token"),
        accessToken: text("access_token"),
        expiresAt: integer("expires_at"),
        tokenType: varchar("token_type", { length: 50 }),
        scope: varchar("scope", { length: 255 }),
        idToken: text("id_token"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("accounts_provider_account_idx").on(
            table.provider,
            table.providerAccountId
        ),
        index("accounts_user_id_idx").on(table.userId),
    ]
);

export const sessions = pgTable(
    "sessions",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        expires: timestamp("expires").notNull(),
    },
    (table) => [
        index("sessions_user_id_idx").on(table.userId),
    ]
);

// ============================================
// SUBSCRIPTIONS & BILLING
// ============================================

export const subscriptions = pgTable(
    "subscriptions",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .unique()
            .references(() => users.id, { onDelete: "cascade" }),

        // Tier info: 'free' | 'power' | 'pro' | 'team'
        tier: varchar("tier", { length: 50 }).default("free").notNull(),
        // Status: 'active' | 'canceled' | 'past_due' | 'trialing'
        status: varchar("status", { length: 50 }).default("active").notNull(),

        // Stripe info
        stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
        stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
        stripePriceId: varchar("stripe_price_id", { length: 255 }),

        // Billing period
        currentPeriodStart: timestamp("current_period_start"),
        currentPeriodEnd: timestamp("current_period_end"),
        cancelAtPeriodEnd: timestamp("cancel_at_period_end"),

        // Timestamps
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        index("subscriptions_user_id_idx").on(table.userId),
        index("subscriptions_stripe_customer_idx").on(table.stripeCustomerId),
        index("subscriptions_status_idx").on(table.status),
    ]
);

// ============================================
// MONTHLY USAGE TRACKING
// ============================================

export const monthlyUsage = pgTable(
    "monthly_usage",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),

        // Period (YYYY-MM format for easy querying)
        period: varchar("period", { length: 7 }).notNull(), // e.g., "2025-01"

        // Usage counts
        messagesUsed: integer("messages_used").default(0).notNull(),
        messagesLimit: integer("messages_limit").notNull(), // Snapshot of limit at period start

        // Bonus messages (from packs, promotions, etc.)
        bonusMessages: integer("bonus_messages").default(0).notNull(),

        // Timestamps
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        index("monthly_usage_user_id_idx").on(table.userId),
        index("monthly_usage_period_idx").on(table.period),
        uniqueIndex("monthly_usage_user_period_idx").on(table.userId, table.period),
    ]
);

// ============================================
// MESSAGE CREDIT PURCHASES
// ============================================

export const messagePurchases = pgTable(
    "message_purchases",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),

        // Pack info: 'boost' | 'power_pack' | 'bulk'
        packId: varchar("pack_id", { length: 50 }).notNull(),
        messagesAmount: integer("messages_amount").notNull(),
        priceInCents: integer("price_in_cents").notNull(),

        // Stripe info
        stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
        stripeSessionId: varchar("stripe_session_id", { length: 255 }),

        // Status: 'pending' | 'completed' | 'failed' | 'refunded'
        status: varchar("status", { length: 50 }).default("pending").notNull(),

        // Which period these credits apply to (null = current period at time of use)
        appliedToPeriod: varchar("applied_to_period", { length: 7 }),

        // Timestamps
        createdAt: timestamp("created_at").defaultNow().notNull(),
        completedAt: timestamp("completed_at"),
    },
    (table) => [
        index("message_purchases_user_id_idx").on(table.userId),
        index("message_purchases_status_idx").on(table.status),
        index("message_purchases_stripe_session_idx").on(table.stripeSessionId),
    ]
);

// ============================================
// ORGANIZATIONS & MEMBERSHIP
// ============================================

export const organizations = pgTable(
    "organizations",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: varchar("name", { length: 255 }).notNull(),
        slug: varchar("slug", { length: 100 }).notNull().unique(),
        logo: varchar("logo", { length: 500 }),
        plan: varchar("plan", { length: 50 }).default("free").notNull(),
        stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
        stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("organizations_slug_idx").on(table.slug),
    ]
);

export const orgMembers = pgTable(
    "org_members",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        organizationId: uuid("organization_id")
            .notNull()
            .references(() => organizations.id, { onDelete: "cascade" }),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        role: varchar("role", { length: 50 }).default("member").notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("org_members_org_user_idx").on(
            table.organizationId,
            table.userId
        ),
        index("org_members_user_id_idx").on(table.userId),
    ]
);

// ============================================
// CONVERSATIONS & MESSAGES
// ============================================

export type AgentType =
    | "technology"
    | "coach"
    | "legal"
    | "hr"
    | "marketing"
    | "sales"
    | "knowledge"
    | "content";

export const conversations = pgTable(
    "conversations",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        organizationId: uuid("organization_id").references(() => organizations.id, {
            onDelete: "cascade",
        }),
        agent: varchar("agent", { length: 50 }).notNull(),
        title: varchar("title", { length: 255 }),
        summary: text("summary"),
        isArchived: boolean("is_archived").default(false).notNull(),
        messageCount: integer("message_count").default(0).notNull(),
        lastMessageAt: timestamp("last_message_at"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
        savedToKnowledgeBaseAt: timestamp("saved_to_knowledge_base_at"),
    },
    (table) => [
        index("conversations_user_id_idx").on(table.userId),
        index("conversations_org_id_idx").on(table.organizationId),
        index("conversations_agent_idx").on(table.agent),
        index("conversations_last_message_idx").on(table.lastMessageAt),
    ]
);

export const messages = pgTable(
    "messages",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        conversationId: uuid("conversation_id")
            .notNull()
            .references(() => conversations.id, { onDelete: "cascade" }),
        role: varchar("role", { length: 20 }).notNull(),
        content: text("content").notNull(),
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("messages_conversation_id_idx").on(table.conversationId),
        index("messages_created_at_idx").on(table.createdAt),
    ]
);

// ============================================
// DOCUMENTS & KNOWLEDGE BASE (Updated with pgvector)
// ============================================

export const documents = pgTable(
    "documents",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        organizationId: uuid("organization_id").references(() => organizations.id, {
            onDelete: "cascade",
        }),
        name: varchar("name", { length: 255 }).notNull(),
        originalName: varchar("original_name", { length: 255 }),
        type: varchar("type", { length: 100 }).notNull(),
        size: integer("size").notNull(),
        url: varchar("url", { length: 500 }),
        storageKey: varchar("storage_key", { length: 500 }),
        status: varchar("status", { length: 50 }).default("pending").notNull(),
        chunkCount: integer("chunk_count").default(0).notNull(),
        metadata: jsonb("metadata"),
        errorMessage: text("error_message"),
        processedAt: timestamp("processed_at"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        index("documents_user_id_idx").on(table.userId),
        index("documents_org_id_idx").on(table.organizationId),
        index("documents_status_idx").on(table.status),
    ]
);

export const documentChunks = pgTable(
    "document_chunks",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        documentId: uuid("document_id")
            .notNull()
            .references(() => documents.id, { onDelete: "cascade" }),
        content: text("content").notNull(),
        chunkIndex: integer("chunk_index").notNull(),
        tokenCount: integer("token_count"),
        embedding: vector("embedding"),
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("document_chunks_document_id_idx").on(table.documentId),
        index("document_chunks_index_idx").on(table.chunkIndex),
    ]
);

// ============================================
// USER SETTINGS
// ============================================

export const userSettings = pgTable("user_settings", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .unique()
        .references(() => users.id, { onDelete: "cascade" }),

    // Company Profile
    companyName: varchar("company_name", { length: 255 }),
    industry: varchar("industry", { length: 100 }),
    companySize: varchar("company_size", { length: 50 }),
    annualRevenue: varchar("annual_revenue", { length: 50 }),
    productsServices: text("products_services"),
    targetMarket: text("target_market"),

    // User Profile
    userRole: varchar("user_role", { length: 100 }),
    yearsExperience: varchar("years_experience", { length: 50 }),
    areasOfFocus: text("areas_of_focus"),

    // Business Context
    currentChallenges: text("current_challenges"),
    shortTermGoals: text("short_term_goals"),
    longTermGoals: text("long_term_goals"),
    techStack: text("tech_stack"),
    teamStructure: text("team_structure"),

    // Preferences
    communicationStyle: varchar("communication_style", { length: 50 }),
    responseLength: varchar("response_length", { length: 50 }),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// USAGE & ANALYTICS
// ============================================

export const usageLogs = pgTable(
    "usage_logs",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        organizationId: uuid("organization_id").references(() => organizations.id, {
            onDelete: "cascade",
        }),
        type: varchar("type", { length: 50 }).notNull(),
        agent: varchar("agent", { length: 50 }),
        inputTokens: integer("input_tokens"),
        outputTokens: integer("output_tokens"),
        model: varchar("model", { length: 100 }),
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("usage_logs_user_id_idx").on(table.userId),
        index("usage_logs_org_id_idx").on(table.organizationId),
        index("usage_logs_created_at_idx").on(table.createdAt),
        index("usage_logs_type_idx").on(table.type),
    ]
);

// ============================================
// FEEDBACK (Bug Reports & Feature Requests)
// ============================================

export const feedback = pgTable(
    "feedback",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        type: varchar("type", { length: 50 }).notNull(),
        title: varchar("title", { length: 255 }).notNull(),
        description: text("description").notNull(),
        status: varchar("status", { length: 50 }).default("open").notNull(),
        priority: varchar("priority", { length: 50 }).default("medium").notNull(),
        stepsToReproduce: text("steps_to_reproduce"),
        expectedBehavior: text("expected_behavior"),
        actualBehavior: text("actual_behavior"),
        useCase: text("use_case"),
        pageUrl: varchar("page_url", { length: 500 }),
        userAgent: varchar("user_agent", { length: 500 }),
        metadata: jsonb("metadata"),
        adminNotes: text("admin_notes"),
        resolvedAt: timestamp("resolved_at"),
        resolvedBy: uuid("resolved_by").references(() => users.id),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        index("feedback_user_id_idx").on(table.userId),
        index("feedback_type_idx").on(table.type),
        index("feedback_status_idx").on(table.status),
        index("feedback_created_at_idx").on(table.createdAt),
    ]
);

// ============================================
// CONTENT CAMPAIGNS TABLE
// Groups related content pieces from a single brief
// ============================================
export const contentCampaigns = pgTable(
    "content_campaigns",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: varchar("user_id", { length: 255 }).notNull(),
        organizationId: uuid("organization_id"),

        // Campaign name/identifier
        name: varchar("name", { length: 500 }),

        // The content brief (single source of truth)
        topic: text("topic").notNull(),
        targetAudience: text("target_audience"),
        keyPoints: jsonb("key_points").$type<string[]>(),
        tone: varchar("tone", { length: 100 }).default("professional"),
        brandId: uuid("brand_id"), // Link to workspace brand if applicable

        // Selected output types
        generateImage: boolean("generate_image").default(false),
        generateLinkedinArticle: boolean("generate_linkedin_article").default(false),
        generateLinkedinPost: boolean("generate_linkedin_post").default(false),
        generateWebBlog: boolean("generate_web_blog").default(false),

        // Generated content references (null until generated)
        heroImageId: uuid("hero_image_id"),
        linkedinArticleId: uuid("linkedin_article_id"),
        linkedinPostId: uuid("linkedin_post_id"),
        webBlogId: uuid("web_blog_id"),

        // Campaign status
        status: varchar("status", { length: 50 }).default("draft").notNull(),
        // draft -> generating -> review -> published -> archived

        // Metadata
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        index("content_campaigns_user_id_idx").on(table.userId),
        index("content_campaigns_status_idx").on(table.status),
        index("content_campaigns_created_at_idx").on(table.createdAt),
    ]
);



// ============================================
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ one, many }) => ({
    accounts: many(accounts),
    sessions: many(sessions),
    subscription: one(subscriptions),
    monthlyUsage: many(monthlyUsage),
    messagePurchases: many(messagePurchases),
    orgMembers: many(orgMembers),
    conversations: many(conversations),
    documents: many(documents),
    usageLogs: many(usageLogs),
    settings: one(userSettings),
    feedback: many(feedback),
    contentItems: many(contentItems),
    contentImages: many(contentImages),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
    user: one(users, {
        fields: [accounts.userId],
        references: [users.id],
    }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
    user: one(users, {
        fields: [subscriptions.userId],
        references: [users.id],
    }),
}));

export const monthlyUsageRelations = relations(monthlyUsage, ({ one }) => ({
    user: one(users, {
        fields: [monthlyUsage.userId],
        references: [users.id],
    }),
}));

export const messagePurchasesRelations = relations(messagePurchases, ({ one }) => ({
    user: one(users, {
        fields: [messagePurchases.userId],
        references: [users.id],
    }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
    user: one(users, {
        fields: [userSettings.userId],
        references: [users.id],
    }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
    members: many(orgMembers),
    conversations: many(conversations),
    documents: many(documents),
    usageLogs: many(usageLogs),
    contentItems: many(contentItems),
    contentImages: many(contentImages),
}));

export const orgMembersRelations = relations(orgMembers, ({ one }) => ({
    organization: one(organizations, {
        fields: [orgMembers.organizationId],
        references: [organizations.id],
    }),
    user: one(users, {
        fields: [orgMembers.userId],
        references: [users.id],
    }),
}));

export const conversationsRelations = relations(
    conversations,
    ({ one, many }) => ({
        user: one(users, {
            fields: [conversations.userId],
            references: [users.id],
        }),
        organization: one(organizations, {
            fields: [conversations.organizationId],
            references: [organizations.id],
        }),
        messages: many(messages),
    })
);

export const messagesRelations = relations(messages, ({ one }) => ({
    conversation: one(conversations, {
        fields: [messages.conversationId],
        references: [conversations.id],
    }),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
    user: one(users, {
        fields: [documents.userId],
        references: [users.id],
    }),
    organization: one(organizations, {
        fields: [documents.organizationId],
        references: [organizations.id],
    }),
    chunks: many(documentChunks),
}));

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
    document: one(documents, {
        fields: [documentChunks.documentId],
        references: [documents.id],
    }),
}));

export const usageLogsRelations = relations(usageLogs, ({ one }) => ({
    user: one(users, {
        fields: [usageLogs.userId],
        references: [users.id],
    }),
    organization: one(organizations, {
        fields: [usageLogs.organizationId],
        references: [organizations.id],
    }),
}));

export const feedbackRelations = relations(feedback, ({ one }) => ({
    user: one(users, {
        fields: [feedback.userId],
        references: [users.id],
    }),
    resolver: one(users, {
        fields: [feedback.resolvedBy],
        references: [users.id],
    }),
}));

// ============================================
// CONTENT ENGINE SCHEMA
// Add this to src/db/schema.ts
// ============================================

// Content Types for the Content Engine
export type ContentType = "linkedin_article" | "linkedin_post" | "web_blog" | "image";
export type ContentStatus = "draft" | "published" | "archived";

// ============================================
// CONTENT ITEMS
// ============================================

export const contentItems = pgTable(
    "content_items",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        organizationId: uuid("organization_id").references(() => organizations.id, {
            onDelete: "cascade",
        }),

        // Content type: 'linkedin_article' | 'linkedin_post' | 'web_blog'
        type: varchar("type", { length: 50 }).notNull(),

        // Status: 'draft' | 'published' | 'archived'
        status: varchar("status", { length: 50 }).default("draft").notNull(),

        // Basic info
        title: varchar("title", { length: 500 }),
        content: text("content"), // Main content body (markdown/HTML)

        // Web blog specific fields (Astro frontmatter compatible)
        description: text("description"),
        heroImageId: uuid("hero_image_id").references(() => contentImages.id, {
            onDelete: "set null",
        }),
        category: varchar("category", { length: 100 }),
        tags: jsonb("tags").$type<string[]>(), // Array of tag strings
        featured: boolean("featured").default(false).notNull(),

        // LinkedIn specific fields
        linkedinPostType: varchar("linkedin_post_type", { length: 50 }), // 'text' | 'image' | 'article'

        // Author info (for blog attribution)
        authorName: varchar("author_name", { length: 255 }),
        authorRole: varchar("author_role", { length: 255 }),
        authorImageUrl: varchar("author_image_url", { length: 500 }),

        // Publishing info
        publishedAt: timestamp("published_at"),
        scheduledFor: timestamp("scheduled_for"),

        // AI generation metadata
        generatedFromPrompt: text("generated_from_prompt"),
        aiModel: varchar("ai_model", { length: 100 }),

        // Current version reference (for quick access)
        currentVersionId: uuid("current_version_id"),

        // Timestamps
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        index("content_items_user_id_idx").on(table.userId),
        index("content_items_org_id_idx").on(table.organizationId),
        index("content_items_type_idx").on(table.type),
        index("content_items_status_idx").on(table.status),
        index("content_items_created_at_idx").on(table.createdAt),
        index("content_items_hero_image_idx").on(table.heroImageId),
    ]
);

// ============================================
// CONTENT VERSIONS (Milestone-based)
// ============================================

export const contentVersions = pgTable(
    "content_versions",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        contentItemId: uuid("content_item_id")
            .notNull()
            .references(() => contentItems.id, { onDelete: "cascade" }),

        // Version info
        versionNumber: integer("version_number").notNull(),
        versionLabel: varchar("version_label", { length: 255 }), // User-defined label like "Final Draft", "Client Review"

        // Snapshot of content at this version
        title: varchar("title", { length: 500 }),
        content: text("content"),
        description: text("description"),
        category: varchar("category", { length: 100 }),
        tags: jsonb("tags").$type<string[]>(),
        heroImageId: uuid("hero_image_id").references(() => contentImages.id, {
            onDelete: "set null",
        }),

        // Metadata
        changeNotes: text("change_notes"), // User notes about what changed
        createdBy: uuid("created_by").references(() => users.id, {
            onDelete: "set null",
        }),

        // Timestamps
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (table) => [
        index("content_versions_item_id_idx").on(table.contentItemId),
        index("content_versions_number_idx").on(table.versionNumber),
        uniqueIndex("content_versions_item_number_idx").on(
            table.contentItemId,
            table.versionNumber
        ),
    ]
);

// ============================================
// CONTENT IMAGES
// ============================================

export const contentImages = pgTable(
    "content_images",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        organizationId: uuid("organization_id").references(() => organizations.id, {
            onDelete: "cascade",
        }),

        // Image info
        name: varchar("name", { length: 255 }).notNull(),
        originalName: varchar("original_name", { length: 255 }),

        // Storage info (Google Cloud Storage)
        gcsUrl: varchar("gcs_url", { length: 1000 }).notNull(),
        gcsBucket: varchar("gcs_bucket", { length: 255 }).notNull(),
        gcsPath: varchar("gcs_path", { length: 500 }).notNull(),

        // Image metadata
        mimeType: varchar("mime_type", { length: 100 }).notNull(),
        size: integer("size").notNull(), // File size in bytes
        width: integer("width"),
        height: integer("height"),

        // Source: 'upload' | 'dalle' | 'other'
        source: varchar("source", { length: 50 }).notNull(),

        // AI generation metadata (for DALL-E images)
        generatedFromPrompt: text("generated_from_prompt"),
        aiModel: varchar("ai_model", { length: 100 }),
        generationSettings: jsonb("generation_settings"), // Store DALL-E params like size, quality, style

        // Alt text for accessibility
        altText: varchar("alt_text", { length: 500 }),

        // Usage tracking
        usageCount: integer("usage_count").default(0).notNull(),

        // Timestamps
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    },
    (table) => [
        index("content_images_user_id_idx").on(table.userId),
        index("content_images_org_id_idx").on(table.organizationId),
        index("content_images_source_idx").on(table.source),
        index("content_images_created_at_idx").on(table.createdAt),
    ]
);

// ============================================
// CONTENT ENGINE RELATIONS
// ============================================

export const contentItemsRelations = relations(contentItems, ({ one, many }) => ({
    user: one(users, {
        fields: [contentItems.userId],
        references: [users.id],
    }),
    organization: one(organizations, {
        fields: [contentItems.organizationId],
        references: [organizations.id],
    }),
    heroImage: one(contentImages, {
        fields: [contentItems.heroImageId],
        references: [contentImages.id],
    }),
    versions: many(contentVersions),
}));

export const contentVersionsRelations = relations(contentVersions, ({ one }) => ({
    contentItem: one(contentItems, {
        fields: [contentVersions.contentItemId],
        references: [contentItems.id],
    }),
    heroImage: one(contentImages, {
        fields: [contentVersions.heroImageId],
        references: [contentImages.id],
    }),
    createdByUser: one(users, {
        fields: [contentVersions.createdBy],
        references: [users.id],
    }),
}));

export const contentImagesRelations = relations(contentImages, ({ one, many }) => ({
    user: one(users, {
        fields: [contentImages.userId],
        references: [users.id],
    }),
    organization: one(organizations, {
        fields: [contentImages.organizationId],
        references: [organizations.id],
    }),
    // Content items using this as hero image
    contentItemsAsHero: many(contentItems),
    contentVersionsAsHero: many(contentVersions),
}));

// ============================================
// UPDATE EXISTING RELATIONS
// Add these to the existing usersRelations:
// ============================================

/*
Add to usersRelations ({ one, many }) => ({
    ...existing relations,
    contentItems: many(contentItems),
    contentImages: many(contentImages),
}));

Add to organizationsRelations ({ many }) => ({
    ...existing relations,
    contentItems: many(contentItems),
    contentImages: many(contentImages),
}));
*/

// ============================================
// TYPE EXPORTS
// ============================================

export type ContentItem = typeof contentItems.$inferSelect;
export type NewContentItem = typeof contentItems.$inferInsert;

export type ContentVersion = typeof contentVersions.$inferSelect;
export type NewContentVersion = typeof contentVersions.$inferInsert;

export type ContentImage = typeof contentImages.$inferSelect;
export type NewContentImage = typeof contentImages.$inferInsert;

