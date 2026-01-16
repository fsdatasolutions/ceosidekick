// src/db/schema.ts - Updated with pgvector support for Knowledge Base
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
    originalName: varchar("original_name", { length: 255 }), // NEW: Original filename
    type: varchar("type", { length: 100 }).notNull(), // "pdf" | "docx" | "txt" | "md"
    size: integer("size").notNull(), // bytes
    url: varchar("url", { length: 500 }), // Public URL (if applicable)
    storageKey: varchar("storage_key", { length: 500 }), // NEW: GCS object key
    status: varchar("status", { length: 50 }).default("pending").notNull(),
    chunkCount: integer("chunk_count").default(0).notNull(),
    metadata: jsonb("metadata"), // page count, word count, etc.
    errorMessage: text("error_message"), // NEW: Error details if failed
    processedAt: timestamp("processed_at"), // NEW: When processing completed
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
    embedding: vector("embedding"), // NEW: pgvector embedding (1536 dims)
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("document_chunks_document_id_idx").on(table.documentId),
    index("document_chunks_index_idx").on(table.chunkIndex),
    // Vector index created via SQL migration (HNSW)
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

// Add this to src/db/schema.ts after the usage_logs table

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
        type: varchar("type", { length: 50 }).notNull(), // 'bug' | 'feature_request'
        title: varchar("title", { length: 255 }).notNull(),
        description: text("description").notNull(),
        status: varchar("status", { length: 50 }).default("open").notNull(), // 'open' | 'in_progress' | 'resolved' | 'closed'
        priority: varchar("priority", { length: 50 }).default("medium").notNull(), // 'low' | 'medium' | 'high' | 'critical'

        // Bug report specific fields
        stepsToReproduce: text("steps_to_reproduce"),
        expectedBehavior: text("expected_behavior"),
        actualBehavior: text("actual_behavior"),

        // Feature request specific fields
        useCase: text("use_case"),

        // Additional context
        pageUrl: varchar("page_url", { length: 500 }), // Where the bug occurred
        userAgent: varchar("user_agent", { length: 500 }), // Browser info
        metadata: jsonb("metadata"), // Any additional data

        // Admin fields
        adminNotes: text("admin_notes"),
        resolvedAt: timestamp("resolved_at"),
        resolvedBy: uuid("resolved_by").references(() => users.id),

        // Timestamps
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
// RELATIONS
// ============================================

export const usersRelations = relations(users, ({ one, many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  orgMembers: many(orgMembers),
  conversations: many(conversations),
  documents: many(documents),
  usageLogs: many(usageLogs),
  settings: one(userSettings),
  feedback: many(feedback)
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