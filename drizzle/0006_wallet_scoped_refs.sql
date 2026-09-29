-- Categoria e cartão só podem ser referenciados pela carteira que os criou.
-- Referências cruzadas existentes são desfeitas antes da constraint.

UPDATE "fixed_income" AS child
SET "categoryId" = NULL
WHERE "categoryId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "category" AS parent
    WHERE parent.id = child."categoryId" AND parent."walletId" = child."walletId"
  );
--> statement-breakpoint
UPDATE "income" AS child
SET "categoryId" = NULL
WHERE "categoryId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "category" AS parent
    WHERE parent.id = child."categoryId" AND parent."walletId" = child."walletId"
  );
--> statement-breakpoint
UPDATE "expense" AS child
SET "categoryId" = NULL
WHERE "categoryId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "category" AS parent
    WHERE parent.id = child."categoryId" AND parent."walletId" = child."walletId"
  );
--> statement-breakpoint
UPDATE "expense" AS child
SET "creditCardId" = NULL
WHERE "creditCardId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "credit_card" AS parent
    WHERE parent.id = child."creditCardId" AND parent."walletId" = child."walletId"
  );
--> statement-breakpoint
UPDATE "recurring_expense" AS child
SET "categoryId" = NULL
WHERE "categoryId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "category" AS parent
    WHERE parent.id = child."categoryId" AND parent."walletId" = child."walletId"
  );
--> statement-breakpoint
UPDATE "recurring_expense" AS child
SET "creditCardId" = NULL
WHERE "creditCardId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "credit_card" AS parent
    WHERE parent.id = child."creditCardId" AND parent."walletId" = child."walletId"
  );
--> statement-breakpoint
UPDATE "recurring_expense_charge" AS child
SET "categoryId" = NULL
WHERE "categoryId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "category" AS parent
    WHERE parent.id = child."categoryId" AND parent."walletId" = child."walletId"
  );
--> statement-breakpoint
UPDATE "recurring_expense_charge" AS child
SET "creditCardId" = NULL
WHERE "creditCardId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "credit_card" AS parent
    WHERE parent.id = child."creditCardId" AND parent."walletId" = child."walletId"
  );
--> statement-breakpoint
UPDATE "subscription" AS child
SET "categoryId" = NULL
WHERE "categoryId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "category" AS parent
    WHERE parent.id = child."categoryId" AND parent."walletId" = child."walletId"
  );
--> statement-breakpoint
UPDATE "subscription" AS child
SET "creditCardId" = NULL
WHERE "creditCardId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "credit_card" AS parent
    WHERE parent.id = child."creditCardId" AND parent."walletId" = child."walletId"
  );
--> statement-breakpoint
UPDATE "subscription_charge" AS child
SET "categoryId" = NULL
WHERE "categoryId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "category" AS parent
    WHERE parent.id = child."categoryId" AND parent."walletId" = child."walletId"
  );
--> statement-breakpoint
UPDATE "subscription_charge" AS child
SET "creditCardId" = NULL
WHERE "creditCardId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "credit_card" AS parent
    WHERE parent.id = child."creditCardId" AND parent."walletId" = child."walletId"
  );
--> statement-breakpoint
UPDATE "installment_plan" AS child
SET "categoryId" = NULL
WHERE "categoryId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "category" AS parent
    WHERE parent.id = child."categoryId" AND parent."walletId" = child."walletId"
  );
--> statement-breakpoint
UPDATE "installment_plan" AS child
SET "creditCardId" = NULL
WHERE "creditCardId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "credit_card" AS parent
    WHERE parent.id = child."creditCardId" AND parent."walletId" = child."walletId"
  );
--> statement-breakpoint
UPDATE "installment" AS child
SET "categoryId" = NULL
WHERE "categoryId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "category" AS parent
    WHERE parent.id = child."categoryId" AND parent."walletId" = child."walletId"
  );
--> statement-breakpoint
UPDATE "installment" AS child
SET "creditCardId" = NULL
WHERE "creditCardId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "credit_card" AS parent
    WHERE parent.id = child."creditCardId" AND parent."walletId" = child."walletId"
  );
--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_id_wallet_unique" UNIQUE ("id", "walletId");
--> statement-breakpoint
ALTER TABLE "credit_card" ADD CONSTRAINT "credit_card_id_wallet_unique" UNIQUE ("id", "walletId");
--> statement-breakpoint
ALTER TABLE "fixed_income" DROP CONSTRAINT "fixed_income_categoryId_category_id_fk";
--> statement-breakpoint
ALTER TABLE "income" DROP CONSTRAINT "income_categoryId_category_id_fk";
--> statement-breakpoint
ALTER TABLE "expense" DROP CONSTRAINT "expense_categoryId_category_id_fk";
--> statement-breakpoint
ALTER TABLE "expense" DROP CONSTRAINT "expense_creditCardId_credit_card_id_fk";
--> statement-breakpoint
ALTER TABLE "recurring_expense" DROP CONSTRAINT "recurring_expense_categoryId_category_id_fk";
--> statement-breakpoint
ALTER TABLE "recurring_expense" DROP CONSTRAINT "recurring_expense_creditCardId_credit_card_id_fk";
--> statement-breakpoint
ALTER TABLE "recurring_expense_charge" DROP CONSTRAINT "recurring_expense_charge_categoryId_category_id_fk";
--> statement-breakpoint
ALTER TABLE "recurring_expense_charge" DROP CONSTRAINT "recurring_expense_charge_creditCardId_credit_card_id_fk";
--> statement-breakpoint
ALTER TABLE "subscription" DROP CONSTRAINT "subscription_categoryId_category_id_fk";
--> statement-breakpoint
ALTER TABLE "subscription" DROP CONSTRAINT "subscription_creditCardId_credit_card_id_fk";
--> statement-breakpoint
ALTER TABLE "subscription_charge" DROP CONSTRAINT "subscription_charge_categoryId_category_id_fk";
--> statement-breakpoint
ALTER TABLE "subscription_charge" DROP CONSTRAINT "subscription_charge_creditCardId_credit_card_id_fk";
--> statement-breakpoint
ALTER TABLE "installment_plan" DROP CONSTRAINT "installment_plan_categoryId_category_id_fk";
--> statement-breakpoint
ALTER TABLE "installment_plan" DROP CONSTRAINT "installment_plan_creditCardId_credit_card_id_fk";
--> statement-breakpoint
ALTER TABLE "installment" DROP CONSTRAINT "installment_categoryId_category_id_fk";
--> statement-breakpoint
ALTER TABLE "installment" DROP CONSTRAINT "installment_creditCardId_credit_card_id_fk";
--> statement-breakpoint
ALTER TABLE "fixed_income" ADD CONSTRAINT "fixed_income_category_wallet_fk" FOREIGN KEY ("categoryId", "walletId") REFERENCES "public"."category"("id", "walletId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "income" ADD CONSTRAINT "income_category_wallet_fk" FOREIGN KEY ("categoryId", "walletId") REFERENCES "public"."category"("id", "walletId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_category_wallet_fk" FOREIGN KEY ("categoryId", "walletId") REFERENCES "public"."category"("id", "walletId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_credit_card_wallet_fk" FOREIGN KEY ("creditCardId", "walletId") REFERENCES "public"."credit_card"("id", "walletId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recurring_expense" ADD CONSTRAINT "recurring_expense_category_wallet_fk" FOREIGN KEY ("categoryId", "walletId") REFERENCES "public"."category"("id", "walletId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recurring_expense" ADD CONSTRAINT "recurring_expense_credit_card_wallet_fk" FOREIGN KEY ("creditCardId", "walletId") REFERENCES "public"."credit_card"("id", "walletId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recurring_expense_charge" ADD CONSTRAINT "recurring_expense_charge_category_wallet_fk" FOREIGN KEY ("categoryId", "walletId") REFERENCES "public"."category"("id", "walletId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recurring_expense_charge" ADD CONSTRAINT "recurring_expense_charge_credit_card_wallet_fk" FOREIGN KEY ("creditCardId", "walletId") REFERENCES "public"."credit_card"("id", "walletId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_category_wallet_fk" FOREIGN KEY ("categoryId", "walletId") REFERENCES "public"."category"("id", "walletId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_credit_card_wallet_fk" FOREIGN KEY ("creditCardId", "walletId") REFERENCES "public"."credit_card"("id", "walletId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "subscription_charge" ADD CONSTRAINT "subscription_charge_category_wallet_fk" FOREIGN KEY ("categoryId", "walletId") REFERENCES "public"."category"("id", "walletId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "subscription_charge" ADD CONSTRAINT "subscription_charge_credit_card_wallet_fk" FOREIGN KEY ("creditCardId", "walletId") REFERENCES "public"."credit_card"("id", "walletId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "installment_plan" ADD CONSTRAINT "installment_plan_category_wallet_fk" FOREIGN KEY ("categoryId", "walletId") REFERENCES "public"."category"("id", "walletId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "installment_plan" ADD CONSTRAINT "installment_plan_credit_card_wallet_fk" FOREIGN KEY ("creditCardId", "walletId") REFERENCES "public"."credit_card"("id", "walletId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "installment" ADD CONSTRAINT "installment_category_wallet_fk" FOREIGN KEY ("categoryId", "walletId") REFERENCES "public"."category"("id", "walletId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "installment" ADD CONSTRAINT "installment_credit_card_wallet_fk" FOREIGN KEY ("creditCardId", "walletId") REFERENCES "public"."credit_card"("id", "walletId") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_wallet_id_change()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW."walletId" IS DISTINCT FROM OLD."walletId" THEN
    RAISE EXCEPTION 'wallet_id_immutable';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS category_wallet_id_immutable ON "category";
--> statement-breakpoint
CREATE TRIGGER category_wallet_id_immutable
BEFORE UPDATE OF "walletId" ON "category"
FOR EACH ROW
EXECUTE FUNCTION prevent_wallet_id_change();
--> statement-breakpoint
DROP TRIGGER IF EXISTS credit_card_wallet_id_immutable ON "credit_card";
--> statement-breakpoint
CREATE TRIGGER credit_card_wallet_id_immutable
BEFORE UPDATE OF "walletId" ON "credit_card"
FOR EACH ROW
EXECUTE FUNCTION prevent_wallet_id_change();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION detach_category_references()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "fixed_income" SET "categoryId" = NULL WHERE "categoryId" = OLD.id;
  UPDATE "income" SET "categoryId" = NULL WHERE "categoryId" = OLD.id;
  UPDATE "expense" SET "categoryId" = NULL WHERE "categoryId" = OLD.id;
  UPDATE "recurring_expense" SET "categoryId" = NULL WHERE "categoryId" = OLD.id;
  UPDATE "recurring_expense_charge" SET "categoryId" = NULL WHERE "categoryId" = OLD.id;
  UPDATE "subscription" SET "categoryId" = NULL WHERE "categoryId" = OLD.id;
  UPDATE "subscription_charge" SET "categoryId" = NULL WHERE "categoryId" = OLD.id;
  UPDATE "installment_plan" SET "categoryId" = NULL WHERE "categoryId" = OLD.id;
  UPDATE "installment" SET "categoryId" = NULL WHERE "categoryId" = OLD.id;
  RETURN OLD;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS category_detach_references ON "category";
--> statement-breakpoint
CREATE TRIGGER category_detach_references
BEFORE DELETE ON "category"
FOR EACH ROW
EXECUTE FUNCTION detach_category_references();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION detach_credit_card_references()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE "expense" SET "creditCardId" = NULL WHERE "creditCardId" = OLD.id;
  UPDATE "recurring_expense" SET "creditCardId" = NULL WHERE "creditCardId" = OLD.id;
  UPDATE "recurring_expense_charge" SET "creditCardId" = NULL WHERE "creditCardId" = OLD.id;
  UPDATE "subscription" SET "creditCardId" = NULL WHERE "creditCardId" = OLD.id;
  UPDATE "subscription_charge" SET "creditCardId" = NULL WHERE "creditCardId" = OLD.id;
  UPDATE "installment_plan" SET "creditCardId" = NULL WHERE "creditCardId" = OLD.id;
  UPDATE "installment" SET "creditCardId" = NULL WHERE "creditCardId" = OLD.id;
  RETURN OLD;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS credit_card_detach_references ON "credit_card";
--> statement-breakpoint
CREATE TRIGGER credit_card_detach_references
BEFORE DELETE ON "credit_card"
FOR EACH ROW
EXECUTE FUNCTION detach_credit_card_references();
