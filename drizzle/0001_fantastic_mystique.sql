CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "message_purchases" RENAME COLUMN "messages_amount" TO "credits_amount";--> statement-breakpoint
ALTER TABLE "monthly_usage" RENAME COLUMN "messages_used" TO "credits_used";--> statement-breakpoint
ALTER TABLE "monthly_usage" RENAME COLUMN "messages_limit" TO "credits_limit";--> statement-breakpoint
ALTER TABLE "monthly_usage" RENAME COLUMN "bonus_messages" TO "bonus_credits";--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "scheduling_meta" jsonb;--> statement-breakpoint
ALTER TABLE "monthly_usage" ADD COLUMN "roundtable_sessions_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "monthly_usage" ADD COLUMN "template_generations_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "monthly_usage" ADD COLUMN "knowledge_base_saves_used" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "content_items_scheduled_for_idx" ON "content_items" USING btree ("scheduled_for");