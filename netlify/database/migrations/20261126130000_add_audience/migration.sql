ALTER TABLE "assignments" ADD COLUMN "audience" text DEFAULT 'All Semesters';
--> statement-breakpoint
ALTER TABLE "syllabus" ADD COLUMN "audience" text DEFAULT 'All Semesters';
