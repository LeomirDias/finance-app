ALTER TABLE "credit_card" ADD COLUMN "dueDate" date;
--> statement-breakpoint
ALTER TABLE "expense" ADD COLUMN "purchasedAt" timestamp;
--> statement-breakpoint
UPDATE "expense" SET "purchasedAt" = "createdAt" WHERE "purchasedAt" IS NULL;
--> statement-breakpoint
ALTER TABLE "expense" ALTER COLUMN "purchasedAt" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "expense" ALTER COLUMN "purchasedAt" SET NOT NULL;
