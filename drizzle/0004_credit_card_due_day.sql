ALTER TABLE "credit_card" ADD COLUMN "dueDay" integer;
--> statement-breakpoint
UPDATE "credit_card"
SET "dueDay" = EXTRACT(DAY FROM "dueDate")::int
WHERE "dueDate" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "credit_card" DROP COLUMN "dueDate";
--> statement-breakpoint
ALTER TABLE "credit_card" ADD CONSTRAINT "credit_card_due_day_check" CHECK ("dueDay" IS NULL OR ("dueDay" >= 1 AND "dueDay" <= 31));
