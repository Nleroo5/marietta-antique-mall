CREATE TYPE "public"."actor" AS ENUM('vendor', 'admin', 'system');--> statement-breakpoint
CREATE TYPE "public"."item_status" AS ENUM('checking', 'live', 'held', 'sold', 'expired', 'removed');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('queued', 'processing', 'done', 'failed');--> statement-breakpoint
CREATE TYPE "public"."match_action" AS ENUM('auto', 'asked', 'ignored');--> statement-breakpoint
CREATE TYPE "public"."match_confidence" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."match_method" AS ENUM('code', 'haiku', 'sonnet');--> statement-breakpoint
CREATE TYPE "public"."sold_source" AS ENUM('vendor', 'report', 'admin');--> statement-breakpoint
CREATE TYPE "public"."vendor_status" AS ENUM('active', 'paused', 'removed');--> statement-breakpoint
CREATE TABLE "activity_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor" "actor" NOT NULL,
	"vendor_id" uuid,
	"device_id" uuid,
	"action" text NOT NULL,
	"item_id" uuid,
	"booth_sale_id" uuid,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_log_vendor_actor" CHECK ("activity_log"."actor" <> 'vendor' or "activity_log"."vendor_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "auth_attempts" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone DEFAULT now() NOT NULL,
	"blocked_until" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "booth_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"booth_id" uuid NOT NULL,
	"percent" integer NOT NULL,
	"starts_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"ended_early_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	CONSTRAINT "booth_sales_percent" CHECK ("booth_sales"."percent" in (10, 15, 20, 25, 30, 50)),
	CONSTRAINT "booth_sales_window" CHECK ("booth_sales"."ends_at" > "booth_sales"."starts_at" and "booth_sales"."ends_at" <= "booth_sales"."starts_at" + interval '31 days'),
	CONSTRAINT "booth_sales_ended_early" CHECK ("booth_sales"."ended_early_at" is null or ("booth_sales"."ended_early_at" >= "booth_sales"."starts_at" and "booth_sales"."closed_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "booths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" text NOT NULL,
	"vendor_id" uuid,
	"svg_id" text,
	"zone" text,
	CONSTRAINT "booths_number_unique" UNIQUE("number"),
	CONSTRAINT "booths_svg_id_unique" UNIQUE("svg_id"),
	CONSTRAINT "booths_number_format" CHECK ("booths"."number" ~ '^[A-Z0-9-]{1,12}$')
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid,
	"booth_id" uuid,
	"type" text NOT NULL,
	"visitor_hash" text,
	"utm_source" text,
	"utm_campaign" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inbound_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resend_email_id" text NOT NULL,
	"from_address" text,
	"status" "job_status" DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"next_attempt_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	CONSTRAINT "inbound_jobs_resend_email_id_unique" UNIQUE("resend_email_id")
);
--> statement-breakpoint
CREATE TABLE "item_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"url" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	CONSTRAINT "item_photos_size" CHECK ("item_photos"."width" > 0 and "item_photos"."height" > 0 and "item_photos"."position" >= 1)
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"booth_id" uuid NOT NULL,
	"status" "item_status" DEFAULT 'checking' NOT NULL,
	"title" text NOT NULL,
	"price_cents" integer,
	"ask_in_store" boolean DEFAULT false NOT NULL,
	"category" text,
	"tag_number" text,
	"photo_url" text NOT NULL,
	"photo_w" integer NOT NULL,
	"photo_h" integer NOT NULL,
	"ai_suggested_title" text,
	"ai_check_attempts" integer DEFAULT 0 NOT NULL,
	"hold_reason" text,
	"posted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"live_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"sold_at" timestamp with time zone,
	"sold_source" "sold_source",
	"removed_at" timestamp with time zone,
	"photo_deleted_at" timestamp with time zone,
	CONSTRAINT "items_title" CHECK (btrim("items"."title") <> '' and char_length("items"."title") <= 80),
	CONSTRAINT "items_price_xor_ask" CHECK (("items"."price_cents" is not null) <> "items"."ask_in_store"),
	CONSTRAINT "items_price_range" CHECK ("items"."price_cents" is null or "items"."price_cents" between 0 and 100000000),
	CONSTRAINT "items_category" CHECK ("items"."category" is null or "items"."category" in ('furniture', 'glass_china', 'pottery', 'jewelry', 'collectibles', 'art', 'lighting', 'textiles', 'books', 'home', 'other')),
	CONSTRAINT "items_photo_size" CHECK ("items"."photo_w" > 0 and "items"."photo_h" > 0),
	CONSTRAINT "items_held_reason" CHECK ("items"."status" <> 'held' or "items"."hold_reason" is not null),
	CONSTRAINT "items_live_window" CHECK ("items"."status" in ('checking', 'held', 'removed') or ("items"."live_at" is not null and "items"."expires_at" is not null and "items"."expires_at" > "items"."live_at")),
	CONSTRAINT "items_sold_pair" CHECK (("items"."sold_at" is null) = ("items"."sold_source" is null)),
	CONSTRAINT "items_sold_has_date" CHECK ("items"."status" <> 'sold' or "items"."sold_at" is not null),
	CONSTRAINT "items_sold_only_when_sold" CHECK ("items"."sold_at" is null or "items"."status" in ('sold', 'removed')),
	CONSTRAINT "items_removed_has_date" CHECK (("items"."status" = 'removed') = ("items"."removed_at" is not null)),
	CONSTRAINT "items_photo_deleted_only_off_page" CHECK ("items"."photo_deleted_at" is null or "items"."status" in ('sold', 'expired', 'removed'))
);
--> statement-breakpoint
CREATE TABLE "sold_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"line_no" integer NOT NULL,
	"vendor_id" uuid,
	"booth_number" text,
	"raw_text" text NOT NULL,
	"price_cents" integer,
	"tag_number" text,
	"sold_on" date,
	"matched_item_id" uuid,
	"confidence" "match_confidence",
	"method" "match_method",
	"reason" text,
	"action" "match_action",
	"applied_at" timestamp with time zone,
	"reviewed_correct" boolean,
	"ask_token_hash" text,
	"asked_email_sent_at" timestamp with time zone,
	"answer" text,
	"answered_at" timestamp with time zone,
	CONSTRAINT "sold_lines_ask_token_hash_unique" UNIQUE("ask_token_hash"),
	CONSTRAINT "sold_lines_answer" CHECK (("sold_lines"."answer" is null) = ("sold_lines"."answered_at" is null) and ("sold_lines"."answer" is null or "sold_lines"."answer" in ('yes', 'no'))),
	CONSTRAINT "sold_lines_line_no" CHECK ("sold_lines"."line_no" >= 1)
);
--> statement-breakpoint
CREATE TABLE "uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"url" text NOT NULL,
	"item_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "uploads_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "vendor_devices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vendor_id" uuid NOT NULL,
	"device_cookie_hash" text NOT NULL,
	"link_version" integer NOT NULL,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "vendor_devices_device_cookie_hash_unique" UNIQUE("device_cookie_hash")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"email" text,
	"token_hash" text NOT NULL,
	"link_version" integer DEFAULT 1 NOT NULL,
	"status" "vendor_status" DEFAULT 'active' NOT NULL,
	"is_test" boolean DEFAULT false NOT NULL,
	"consent_at" timestamp with time zone,
	"stats_email_opt_out_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vendors_token_hash_unique" UNIQUE("token_hash"),
	CONSTRAINT "vendors_name_present" CHECK (btrim("vendors"."name") <> '' and btrim("vendors"."display_name") <> ''),
	CONSTRAINT "vendors_link_version_positive" CHECK ("vendors"."link_version" > 0)
);
--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_device_id_vendor_devices_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."vendor_devices"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_booth_sale_id_booth_sales_id_fk" FOREIGN KEY ("booth_sale_id") REFERENCES "public"."booth_sales"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booth_sales" ADD CONSTRAINT "booth_sales_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booth_sales" ADD CONSTRAINT "booth_sales_booth_id_booths_id_fk" FOREIGN KEY ("booth_id") REFERENCES "public"."booths"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booths" ADD CONSTRAINT "booths_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_booth_id_booths_id_fk" FOREIGN KEY ("booth_id") REFERENCES "public"."booths"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_photos" ADD CONSTRAINT "item_photos_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "items" ADD CONSTRAINT "items_booth_id_booths_id_fk" FOREIGN KEY ("booth_id") REFERENCES "public"."booths"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sold_lines" ADD CONSTRAINT "sold_lines_job_id_inbound_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."inbound_jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sold_lines" ADD CONSTRAINT "sold_lines_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sold_lines" ADD CONSTRAINT "sold_lines_matched_item_id_items_id_fk" FOREIGN KEY ("matched_item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_devices" ADD CONSTRAINT "vendor_devices_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_log_vendor_idx" ON "activity_log" USING btree ("vendor_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "activity_log_item_idx" ON "activity_log" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "booth_sales_booth_idx" ON "booth_sales" USING btree ("booth_id","ends_at");--> statement-breakpoint
CREATE UNIQUE INDEX "booth_sales_one_open_per_booth" ON "booth_sales" USING btree ("booth_id") WHERE "booth_sales"."closed_at" is null;--> statement-breakpoint
CREATE INDEX "booths_vendor_idx" ON "booths" USING btree ("vendor_id");--> statement-breakpoint
CREATE INDEX "events_created_idx" ON "events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "events_item_idx" ON "events" USING btree ("item_id");--> statement-breakpoint
CREATE INDEX "events_booth_idx" ON "events" USING btree ("booth_id");--> statement-breakpoint
CREATE INDEX "inbound_jobs_due_idx" ON "inbound_jobs" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE UNIQUE INDEX "item_photos_item_position_idx" ON "item_photos" USING btree ("item_id","position");--> statement-breakpoint
CREATE INDEX "items_status_live_idx" ON "items" USING btree ("status","live_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "items_booth_status_idx" ON "items" USING btree ("booth_id","status");--> statement-breakpoint
CREATE INDEX "items_vendor_status_idx" ON "items" USING btree ("vendor_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "sold_lines_job_line_idx" ON "sold_lines" USING btree ("job_id","line_no");--> statement-breakpoint
CREATE INDEX "sold_lines_matched_item_idx" ON "sold_lines" USING btree ("matched_item_id");--> statement-breakpoint
CREATE INDEX "uploads_unclaimed_idx" ON "uploads" USING btree ("created_at") WHERE "uploads"."item_id" is null and "uploads"."deleted_at" is null;--> statement-breakpoint
CREATE INDEX "vendor_devices_vendor_idx" ON "vendor_devices" USING btree ("vendor_id");