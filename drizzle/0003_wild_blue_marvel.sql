ALTER TABLE "users" ADD COLUMN "onboarding_completed" boolean DEFAULT false NOT NULL;
--> Mark all existing users as having completed onboarding (they should not be forced through it)
UPDATE "users" SET "onboarding_completed" = true;