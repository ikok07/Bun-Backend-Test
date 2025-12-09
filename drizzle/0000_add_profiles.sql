CREATE TYPE "public"."profile_roles_enum" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"role" "profile_roles_enum" NOT NULL,
	CONSTRAINT "profiles_email_unique" UNIQUE("email")
);
