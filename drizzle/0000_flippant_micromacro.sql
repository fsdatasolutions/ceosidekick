CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"provider" varchar(50) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(50),
	"scope" varchar(255),
	"id_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"organization_id" uuid,
	"name" varchar(500),
	"topic" text NOT NULL,
	"target_audience" text,
	"key_points" jsonb,
	"tone" varchar(100) DEFAULT 'professional',
	"brand_id" uuid,
	"generate_image" boolean DEFAULT false,
	"generate_linkedin_article" boolean DEFAULT false,
	"generate_linkedin_post" boolean DEFAULT false,
	"generate_web_blog" boolean DEFAULT false,
	"hero_image_id" uuid,
	"linkedin_article_id" uuid,
	"linkedin_post_id" uuid,
	"web_blog_id" uuid,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid,
	"name" varchar(255) NOT NULL,
	"original_name" varchar(255),
	"gcs_url" varchar(1000) NOT NULL,
	"gcs_bucket" varchar(255) NOT NULL,
	"gcs_path" varchar(500) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size" integer NOT NULL,
	"width" integer,
	"height" integer,
	"source" varchar(50) NOT NULL,
	"generated_from_prompt" text,
	"ai_model" varchar(100),
	"generation_settings" jsonb,
	"alt_text" varchar(500),
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid,
	"type" varchar(50) NOT NULL,
	"status" varchar(50) DEFAULT 'draft' NOT NULL,
	"title" varchar(500),
	"content" text,
	"description" text,
	"hero_image_id" uuid,
	"category" varchar(100),
	"tags" jsonb,
	"featured" boolean DEFAULT false NOT NULL,
	"linkedin_post_type" varchar(50),
	"author_name" varchar(255),
	"author_role" varchar(255),
	"author_image_url" varchar(500),
	"published_at" timestamp,
	"scheduled_for" timestamp,
	"generated_from_prompt" text,
	"ai_model" varchar(100),
	"current_version_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_item_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"version_label" varchar(255),
	"title" varchar(500),
	"content" text,
	"description" text,
	"category" varchar(100),
	"tags" jsonb,
	"hero_image_id" uuid,
	"change_notes" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid,
	"agent" varchar(50) NOT NULL,
	"title" varchar(255),
	"summary" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"message_count" integer DEFAULT 0 NOT NULL,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"saved_to_knowledge_base_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "document_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"content" text NOT NULL,
	"chunk_index" integer NOT NULL,
	"token_count" integer,
	"embedding" vector(1536),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid,
	"name" varchar(255) NOT NULL,
	"original_name" varchar(255),
	"type" varchar(100) NOT NULL,
	"size" integer NOT NULL,
	"url" varchar(500),
	"storage_key" varchar(500),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"chunk_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"error_message" text,
	"processed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"status" varchar(50) DEFAULT 'open' NOT NULL,
	"priority" varchar(50) DEFAULT 'medium' NOT NULL,
	"steps_to_reproduce" text,
	"expected_behavior" text,
	"actual_behavior" text,
	"use_case" text,
	"page_url" varchar(500),
	"user_agent" varchar(500),
	"metadata" jsonb,
	"admin_notes" text,
	"resolved_at" timestamp,
	"resolved_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "message_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pack_id" varchar(50) NOT NULL,
	"messages_amount" integer NOT NULL,
	"price_in_cents" integer NOT NULL,
	"stripe_payment_intent_id" varchar(255),
	"stripe_session_id" varchar(255),
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"applied_to_period" varchar(7),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"period" varchar(7) NOT NULL,
	"messages_used" integer DEFAULT 0 NOT NULL,
	"messages_limit" integer NOT NULL,
	"bonus_messages" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "org_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(50) DEFAULT 'member' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"logo" varchar(500),
	"plan" varchar(50) DEFAULT 'free' NOT NULL,
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" varchar(255) NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tier" varchar(50) DEFAULT 'free' NOT NULL,
	"status" varchar(50) DEFAULT 'active' NOT NULL,
	"stripe_customer_id" varchar(255),
	"stripe_subscription_id" varchar(255),
	"stripe_price_id" varchar(255),
	"current_period_start" timestamp,
	"current_period_end" timestamp,
	"cancel_at_period_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid,
	"type" varchar(50) NOT NULL,
	"agent" varchar(50),
	"input_tokens" integer,
	"output_tokens" integer,
	"model" varchar(100),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_name" varchar(255),
	"industry" varchar(100),
	"company_size" varchar(50),
	"annual_revenue" varchar(50),
	"products_services" text,
	"target_market" text,
	"user_role" varchar(100),
	"years_experience" varchar(50),
	"areas_of_focus" text,
	"current_challenges" text,
	"short_term_goals" text,
	"long_term_goals" text,
	"tech_stack" text,
	"team_structure" text,
	"communication_style" varchar(50),
	"response_length" varchar(50),
	"blog_content_dir" text,
	"blog_images_dir" text,
	"site_url" varchar(500),
	"linkedin_profile_url" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_settings_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(255),
	"name" varchar(255),
	"image" varchar(500),
	"role" text DEFAULT 'user',
	"email_verified" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_images" ADD CONSTRAINT "content_images_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_images" ADD CONSTRAINT "content_images_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_hero_image_id_content_images_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."content_images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_hero_image_id_content_images_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."content_images"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_versions" ADD CONSTRAINT "content_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_chunks" ADD CONSTRAINT "document_chunks_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_purchases" ADD CONSTRAINT "message_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_usage" ADD CONSTRAINT "monthly_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "org_members" ADD CONSTRAINT "org_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_account_idx" ON "accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "content_campaigns_user_id_idx" ON "content_campaigns" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "content_campaigns_status_idx" ON "content_campaigns" USING btree ("status");--> statement-breakpoint
CREATE INDEX "content_campaigns_created_at_idx" ON "content_campaigns" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "content_images_user_id_idx" ON "content_images" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "content_images_org_id_idx" ON "content_images" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "content_images_source_idx" ON "content_images" USING btree ("source");--> statement-breakpoint
CREATE INDEX "content_images_created_at_idx" ON "content_images" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "content_items_user_id_idx" ON "content_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "content_items_org_id_idx" ON "content_items" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "content_items_type_idx" ON "content_items" USING btree ("type");--> statement-breakpoint
CREATE INDEX "content_items_status_idx" ON "content_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "content_items_created_at_idx" ON "content_items" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "content_items_hero_image_idx" ON "content_items" USING btree ("hero_image_id");--> statement-breakpoint
CREATE INDEX "content_versions_item_id_idx" ON "content_versions" USING btree ("content_item_id");--> statement-breakpoint
CREATE INDEX "content_versions_number_idx" ON "content_versions" USING btree ("version_number");--> statement-breakpoint
CREATE UNIQUE INDEX "content_versions_item_number_idx" ON "content_versions" USING btree ("content_item_id","version_number");--> statement-breakpoint
CREATE INDEX "conversations_user_id_idx" ON "conversations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "conversations_org_id_idx" ON "conversations" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "conversations_agent_idx" ON "conversations" USING btree ("agent");--> statement-breakpoint
CREATE INDEX "conversations_last_message_idx" ON "conversations" USING btree ("last_message_at");--> statement-breakpoint
CREATE INDEX "document_chunks_document_id_idx" ON "document_chunks" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_chunks_index_idx" ON "document_chunks" USING btree ("chunk_index");--> statement-breakpoint
CREATE INDEX "documents_user_id_idx" ON "documents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "documents_org_id_idx" ON "documents" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "documents_status_idx" ON "documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feedback_user_id_idx" ON "feedback" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "feedback_type_idx" ON "feedback" USING btree ("type");--> statement-breakpoint
CREATE INDEX "feedback_status_idx" ON "feedback" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feedback_created_at_idx" ON "feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "message_purchases_user_id_idx" ON "message_purchases" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "message_purchases_status_idx" ON "message_purchases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "message_purchases_stripe_session_idx" ON "message_purchases" USING btree ("stripe_session_id");--> statement-breakpoint
CREATE INDEX "messages_conversation_id_idx" ON "messages" USING btree ("conversation_id");--> statement-breakpoint
CREATE INDEX "messages_created_at_idx" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "monthly_usage_user_id_idx" ON "monthly_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "monthly_usage_period_idx" ON "monthly_usage" USING btree ("period");--> statement-breakpoint
CREATE UNIQUE INDEX "monthly_usage_user_period_idx" ON "monthly_usage" USING btree ("user_id","period");--> statement-breakpoint
CREATE UNIQUE INDEX "org_members_org_user_idx" ON "org_members" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE INDEX "org_members_user_id_idx" ON "org_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_slug_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscriptions_stripe_customer_idx" ON "subscriptions" USING btree ("stripe_customer_id");--> statement-breakpoint
CREATE INDEX "subscriptions_status_idx" ON "subscriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "usage_logs_user_id_idx" ON "usage_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "usage_logs_org_id_idx" ON "usage_logs" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "usage_logs_created_at_idx" ON "usage_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "usage_logs_type_idx" ON "usage_logs" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");