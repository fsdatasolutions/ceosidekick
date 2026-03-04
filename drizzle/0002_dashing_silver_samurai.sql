ALTER TABLE "content_images" ADD COLUMN "campaign_id" uuid;--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "campaign_id" uuid;--> statement-breakpoint
ALTER TABLE "content_images" ADD CONSTRAINT "content_images_campaign_id_content_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."content_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_campaign_id_content_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."content_campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_images_campaign_id_idx" ON "content_images" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "content_items_campaign_id_idx" ON "content_items" USING btree ("campaign_id");