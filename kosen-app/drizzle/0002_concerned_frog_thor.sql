DROP TABLE "appointments" CASCADE;--> statement-breakpoint
DROP TABLE "counselors" CASCADE;--> statement-breakpoint
DROP TABLE "dorm_buildings" CASCADE;--> statement-breakpoint
DROP TABLE "dorm_points_changes" CASCADE;--> statement-breakpoint
DROP TABLE "dorm_room_assignments" CASCADE;--> statement-breakpoint
DROP TABLE "dorm_rooms" CASCADE;--> statement-breakpoint
DROP TABLE "family_history" CASCADE;--> statement-breakpoint
DROP TABLE "medical_history_forms" CASCADE;--> statement-breakpoint
DROP TABLE "notifications" CASCADE;--> statement-breakpoint
DROP TABLE "rooms" CASCADE;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" varchar(255);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "year" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dorm_room" varchar(50);--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "full_name";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "dorm_points";--> statement-breakpoint
DROP TYPE "public"."appointment_status";--> statement-breakpoint
DROP TYPE "public"."notification_type";