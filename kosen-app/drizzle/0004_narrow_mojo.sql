ALTER TABLE "announcements" ALTER COLUMN "category" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "category" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "target_year" integer;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "target_department" varchar(100);