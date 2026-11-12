ALTER TYPE "public"."resource_type" ADD VALUE 'NOTE';--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "bookmarked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "resources" ADD COLUMN "last_opened_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "resources_user_url_unique" ON "resources" USING btree ("user_id","url");--> statement-breakpoint
CREATE INDEX "resources_user_bookmarked_idx" ON "resources" USING btree ("user_id","bookmarked");--> statement-breakpoint
CREATE INDEX "resources_user_last_opened_idx" ON "resources" USING btree ("user_id","last_opened_at");