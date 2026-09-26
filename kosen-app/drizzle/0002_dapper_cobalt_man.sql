CREATE TYPE "public"."repairment_request_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "dorm_buildings" (
	"building_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_number" integer NOT NULL,
	CONSTRAINT "dorm_buildings_building_number_unique" UNIQUE("building_number")
);
--> statement-breakpoint
CREATE TABLE "dorm_points_changes" (
	"dorm_point_changes_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"points" integer NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dorm_room_assignments" (
	"assignment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"room_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "dorm_rooms" (
	"room_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"room_number" varchar(4) NOT NULL,
	"room_photo_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "dorm_rooms_building_id_room_number_unique" UNIQUE("building_id","room_number")
);
--> statement-breakpoint
CREATE TABLE "repairment_requests" (
	"repairment_request_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"description" text NOT NULL,
	"status" "repairment_request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dorm_points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "dorm_points_changes" ADD CONSTRAINT "dorm_points_changes_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_room_assignments" ADD CONSTRAINT "dorm_room_assignments_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_room_assignments" ADD CONSTRAINT "dorm_room_assignments_room_id_dorm_rooms_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."dorm_rooms"("room_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_rooms" ADD CONSTRAINT "dorm_rooms_building_id_dorm_buildings_building_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."dorm_buildings"("building_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repairment_requests" ADD CONSTRAINT "repairment_requests_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_room_unique" ON "dorm_room_assignments" USING btree ("user_id") WHERE "dorm_room_assignments"."ended_at" IS NULL;