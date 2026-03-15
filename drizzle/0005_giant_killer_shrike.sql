CREATE TABLE "page_views" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" varchar(500) NOT NULL,
	"referrer" varchar(1000),
	"user_agent" varchar(500),
	"country" varchar(100),
	"visitor_id" varchar(64),
	"user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "github_repo" varchar(255);--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "github_branch" varchar(100);--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "github_token" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "github_blog_path" varchar(500);--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "github_images_path" varchar(500);--> statement-breakpoint
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "page_views_path_idx" ON "page_views" USING btree ("path");--> statement-breakpoint
CREATE INDEX "page_views_created_at_idx" ON "page_views" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "page_views_visitor_id_idx" ON "page_views" USING btree ("visitor_id");