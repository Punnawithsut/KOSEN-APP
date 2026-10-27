DROP INDEX "loans_quota_idx";--> statement-breakpoint
ALTER TABLE "loans" ADD COLUMN "quota_consumed_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "loans_quota_idx" ON "loans" USING btree ("borrower_id","term_id","quota_consumed_at");