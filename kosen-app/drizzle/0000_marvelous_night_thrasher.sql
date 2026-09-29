CREATE TYPE "public"."announcement_category" AS ENUM('for_you', 'news', 'events');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('reminder', 'confirmation', 'cancellation');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'counselor', 'admin');--> statement-breakpoint
CREATE TABLE "announcement_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"announcement_id" uuid NOT NULL,
	"file_url" text NOT NULL,
	"file_type" varchar(50) DEFAULT 'image',
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" "announcement_category" DEFAULT 'news' NOT NULL,
	"author_id" uuid,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"appointment_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_code" varchar(20) NOT NULL,
	"user_id" uuid NOT NULL,
	"counselor_id" uuid,
	"appointment_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"note" text,
	"status" "appointment_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "appointments_appointment_code_unique" UNIQUE("appointment_code")
);
--> statement-breakpoint
CREATE TABLE "counselors" (
	"counselor_id" uuid PRIMARY KEY NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"nickname" varchar(100),
	"phone" varchar(20),
	"line_id" varchar(100),
	"photo_url" text,
	"bio" text,
	"detail" text
);
--> statement-breakpoint
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
CREATE TABLE "family_history" (
	"family_history_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"form_id" uuid NOT NULL,
	"relationship" varchar(100),
	"age" integer,
	"phone" varchar(20),
	"health_history" text
);
--> statement-breakpoint
CREATE TABLE "medical_history_forms" (
	"form_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"appointment_id" uuid,
	"has_consulted_psychiatrist" boolean,
	"psychiatric_visit_count" integer,
	"consultation_date" date,
	"hospital_or_clinic" varchar(255),
	"doctor_or_psychologist_name" varchar(255),
	"past_problem" text,
	"current_medication" text,
	"medication_result" text,
	"has_chronic_disease" boolean,
	"chronic_disease_name" varchar(255),
	"chronic_disease_symptom" text,
	"treatment_detail" text,
	"drug_allergy_detail" text,
	"food_or_other_allergy_detail" text,
	"has_accident" boolean,
	"accident_detail" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"notification_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"detail" text,
	"sent_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"student_id" varchar(20),
	"full_name" varchar(255),
	"email" varchar(255) NOT NULL,
	"phone" varchar(20),
	"emergency_phone" varchar(20),
	"department" varchar(100),
	"is_consented" boolean DEFAULT false NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"dorm_points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_student_id_unique" UNIQUE("student_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "announcement_attachments" ADD CONSTRAINT "announcement_attachments_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_users_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("user_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_counselor_id_counselors_counselor_id_fk" FOREIGN KEY ("counselor_id") REFERENCES "public"."counselors"("counselor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counselors" ADD CONSTRAINT "counselors_counselor_id_users_user_id_fk" FOREIGN KEY ("counselor_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_points_changes" ADD CONSTRAINT "dorm_points_changes_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_room_assignments" ADD CONSTRAINT "dorm_room_assignments_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_room_assignments" ADD CONSTRAINT "dorm_room_assignments_room_id_dorm_rooms_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."dorm_rooms"("room_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dorm_rooms" ADD CONSTRAINT "dorm_rooms_building_id_dorm_buildings_building_id_fk" FOREIGN KEY ("building_id") REFERENCES "public"."dorm_buildings"("building_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_history" ADD CONSTRAINT "family_history_form_id_medical_history_forms_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."medical_history_forms"("form_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_history_forms" ADD CONSTRAINT "medical_history_forms_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_history_forms" ADD CONSTRAINT "medical_history_forms_appointment_id_appointments_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("appointment_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_appointment_id_appointments_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("appointment_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "announcement_attachments_announcement_id_idx" ON "announcement_attachments" USING btree ("announcement_id");--> statement-breakpoint
CREATE INDEX "announcements_category_idx" ON "announcements" USING btree ("category");--> statement-breakpoint
CREATE INDEX "announcements_author_id_idx" ON "announcements" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "appointments_user_id_idx" ON "appointments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "appointments_counselor_id_idx" ON "appointments" USING btree ("counselor_id");--> statement-breakpoint
CREATE INDEX "appointments_appointment_date_idx" ON "appointments" USING btree ("appointment_date");--> statement-breakpoint
CREATE INDEX "appointments_status_idx" ON "appointments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appointments_counselor_id_date_idx" ON "appointments" USING btree ("counselor_id","appointment_date");--> statement-breakpoint
CREATE INDEX "appointments_user_id_date_idx" ON "appointments" USING btree ("user_id","appointment_date");--> statement-breakpoint
CREATE UNIQUE INDEX "user_room_unique" ON "dorm_room_assignments" USING btree ("user_id") WHERE "dorm_room_assignments"."ended_at" IS NULL;--> statement-breakpoint
CREATE INDEX "family_history_form_id_idx" ON "family_history" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "medical_history_forms_user_id_idx" ON "medical_history_forms" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "medical_history_forms_appointment_id_idx" ON "medical_history_forms" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "notifications_appointment_id_idx" ON "notifications" USING btree ("appointment_id");