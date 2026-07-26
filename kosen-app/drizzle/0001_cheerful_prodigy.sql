CREATE TYPE "public"."appointment_status" AS ENUM('pending', 'confirmed', 'cancelled', 'completed', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('reminder', 'confirmation', 'cancellation');--> statement-breakpoint
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
	"counselor_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"nickname" varchar(100),
	"phone" varchar(20),
	"line_id" varchar(100),
	"photo_url" text,
	"bio" text,
	"detail" text
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
CREATE TABLE "users" (
	"user_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" varchar(20) NOT NULL,
	"full_name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"emergency_phone" varchar(20),
	"department" varchar(100),
	"is_consented" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_student_id_unique" UNIQUE("student_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_counselor_id_counselors_counselor_id_fk" FOREIGN KEY ("counselor_id") REFERENCES "public"."counselors"("counselor_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_history" ADD CONSTRAINT "family_history_form_id_medical_history_forms_form_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."medical_history_forms"("form_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_history_forms" ADD CONSTRAINT "medical_history_forms_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_history_forms" ADD CONSTRAINT "medical_history_forms_appointment_id_appointments_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("appointment_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_appointment_id_appointments_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("appointment_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "appointments_user_id_idx" ON "appointments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "appointments_counselor_id_idx" ON "appointments" USING btree ("counselor_id");--> statement-breakpoint
CREATE INDEX "appointments_appointment_date_idx" ON "appointments" USING btree ("appointment_date");--> statement-breakpoint
CREATE INDEX "appointments_status_idx" ON "appointments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "appointments_counselor_id_date_idx" ON "appointments" USING btree ("counselor_id","appointment_date");--> statement-breakpoint
CREATE INDEX "appointments_user_id_date_idx" ON "appointments" USING btree ("user_id","appointment_date");--> statement-breakpoint
CREATE INDEX "family_history_form_id_idx" ON "family_history" USING btree ("form_id");--> statement-breakpoint
CREATE INDEX "medical_history_forms_user_id_idx" ON "medical_history_forms" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "medical_history_forms_appointment_id_idx" ON "medical_history_forms" USING btree ("appointment_id");--> statement-breakpoint
CREATE INDEX "notifications_appointment_id_idx" ON "notifications" USING btree ("appointment_id");