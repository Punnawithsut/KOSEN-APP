ALTER TABLE "announcements" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "deleted_by" uuid;--> statement-breakpoint
ALTER TABLE "announcements" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_users_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_updated_by_users_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_deleted_by_users_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;