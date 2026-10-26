CREATE TABLE "dorm_buildings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"code" varchar(20) NOT NULL,
	"gender" varchar(20),
	"capacity" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_by" uuid,
	CONSTRAINT "dorm_buildings_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "dorm_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"building_id" uuid NOT NULL,
	"room_number" varchar(20) NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"deleted_by" uuid
);
--> statement-breakpoint
ALTER TABLE "dorm_buildings" ADD CONSTRAINT "dorm_buildings_created_by_users_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_buildings" ADD CONSTRAINT "dorm_buildings_updated_by_users_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_buildings" ADD CONSTRAINT "dorm_buildings_deleted_by_users_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_rooms" ADD CONSTRAINT "dorm_rooms_building_id_dorm_buildings_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."dorm_buildings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_rooms" ADD CONSTRAINT "dorm_rooms_created_by_users_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_rooms" ADD CONSTRAINT "dorm_rooms_updated_by_users_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_rooms" ADD CONSTRAINT "dorm_rooms_deleted_by_users_user_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dorm_buildings_code_idx" ON "dorm_buildings" USING btree ("code");--> statement-breakpoint
CREATE INDEX "dorm_buildings_gender_idx" ON "dorm_buildings" USING btree ("gender");--> statement-breakpoint
CREATE INDEX "dorm_rooms_building_id_idx" ON "dorm_rooms" USING btree ("building_id");--> statement-breakpoint
CREATE UNIQUE INDEX "dorm_rooms_building_room_uq" ON "dorm_rooms" USING btree ("building_id","room_number");