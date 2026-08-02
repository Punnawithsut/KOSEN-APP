ALTER TYPE "public"."user_role" ADD VALUE 'counselor' BEFORE 'admin';--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'counselors'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "counselors" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "counselors" ALTER COLUMN "counselor_id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "counselors" ALTER COLUMN "counselor_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "counselors" ADD CONSTRAINT "counselors_counselor_id_users_user_id_fk" FOREIGN KEY ("counselor_id") REFERENCES "public"."users"("user_id") ON DELETE no action ON UPDATE no action;