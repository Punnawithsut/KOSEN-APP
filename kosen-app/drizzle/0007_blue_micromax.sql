ALTER TABLE "announcements" ALTER COLUMN "category" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."announcement_category";--> statement-breakpoint
CREATE TYPE "public"."announcement_category" AS ENUM('student affair', 'dormitory', 'industrial linkage', 'international affair', 'academic affair', 'club', 'others');--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "category" SET DATA TYPE "public"."announcement_category" USING "category"::"public"."announcement_category";--> statement-breakpoint
ALTER TABLE "announcement_attachments" ALTER COLUMN "file_type" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "announcement_attachments" ALTER COLUMN "file_type" SET DEFAULT 'image';