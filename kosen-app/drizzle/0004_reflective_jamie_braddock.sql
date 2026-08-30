CREATE TABLE "activities" (
	"activity_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"activity_date" date NOT NULL,
	"hours" numeric(5, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_images" (
	"image_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"image_url" varchar(255) NOT NULL,
	"display_order" integer
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"category_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(50)
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "class_name" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "profile_pic_url" varchar(255);--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_category_id_categories_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_images" ADD CONSTRAINT "activity_images_activity_id_activities_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("activity_id") ON DELETE cascade ON UPDATE no action;