CREATE TYPE "public"."cycle" AS ENUM('CP', 'CI');--> statement-breakpoint
CREATE TYPE "public"."file_category" AS ENUM('Cours', 'TD', 'TP', 'EXAM', 'Autre');--> statement-breakpoint
CREATE TYPE "public"."file_type" AS ENUM('pdf', 'docx', 'pptx', 'xls', 'xlsx', 'zip', 'jpg', 'jpeg', 'png', 'gif');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('student', 'responsable', 'superadmin');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"action" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"details" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" integer NOT NULL,
	"category" "file_category" DEFAULT 'Autre' NOT NULL,
	"label" text,
	"file_name" text NOT NULL,
	"original_name" text NOT NULL,
	"display_name" text NOT NULL,
	"file_type" "file_type" NOT NULL,
	"file_size" integer NOT NULL,
	"drive_id" text NOT NULL,
	"web_view_link" text,
	"web_content_link" text,
	"thumbnail_link" text,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "files_driveId_unique" UNIQUE("drive_id")
);
--> statement-breakpoint
CREATE TABLE "filieres" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"cycle" "cycle" NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "filieres_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "login_attempts" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"semester_id" integer NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "modules_semesterId_name_unique" UNIQUE("semester_id","name")
);
--> statement-breakpoint
CREATE TABLE "pending_uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"module_id" integer NOT NULL,
	"category" "file_category" NOT NULL,
	"label" text,
	"folder_id" text NOT NULL,
	"file_name" text NOT NULL,
	"original_name" text NOT NULL,
	"file_type" "file_type" NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_parcours" (
	"user_id" uuid NOT NULL,
	"semester_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_parcours_user_id_semester_id_pk" PRIMARY KEY("user_id","semester_id")
);
--> statement-breakpoint
CREATE TABLE "semesters" (
	"id" serial PRIMARY KEY NOT NULL,
	"year_id" integer NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "semesters_yearId_name_unique" UNIQUE("year_id","name")
);
--> statement-breakpoint
CREATE TABLE "student_allowlist" (
	"email" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" "role" NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"password_hash" text,
	"assigned_year_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"password_changed_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_email_lowercase" CHECK ("users"."email" = lower("users"."email")),
	CONSTRAINT "users_responsable_has_year" CHECK (("users"."role" = 'responsable') = ("users"."assigned_year_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "years" (
	"id" serial PRIMARY KEY NOT NULL,
	"filiere_id" integer NOT NULL,
	"code" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "years_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "modules" ADD CONSTRAINT "modules_semester_id_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_uploads" ADD CONSTRAINT "pending_uploads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pending_uploads" ADD CONSTRAINT "pending_uploads_module_id_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_parcours" ADD CONSTRAINT "saved_parcours_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_parcours" ADD CONSTRAINT "saved_parcours_semester_id_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "semesters" ADD CONSTRAINT "semesters_year_id_years_id_fk" FOREIGN KEY ("year_id") REFERENCES "public"."years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_assigned_year_id_years_id_fk" FOREIGN KEY ("assigned_year_id") REFERENCES "public"."years"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "years" ADD CONSTRAINT "years_filiere_id_filieres_id_fk" FOREIGN KEY ("filiere_id") REFERENCES "public"."filieres"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_logs_created_at_index" ON "activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "activity_logs_action_created_at_index" ON "activity_logs" USING btree ("action","created_at");--> statement-breakpoint
CREATE INDEX "activity_logs_user_id_index" ON "activity_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "files_module_id_category_index" ON "files" USING btree ("module_id","category");--> statement-breakpoint
CREATE INDEX "files_uploaded_by_index" ON "files" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "files_created_at_index" ON "files" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "pending_uploads_expires_at_index" ON "pending_uploads" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "years_filiere_id_index" ON "years" USING btree ("filiere_id");