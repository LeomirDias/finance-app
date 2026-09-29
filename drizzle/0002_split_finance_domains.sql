CREATE TABLE "fixed_income" (
	"id" text PRIMARY KEY NOT NULL,
	"walletId" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "recurrentTransactionStatus" NOT NULL,
	"dayOfMonth" integer NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date,
	"paymentMethod" "transactionPaymentMethod" NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"categoryId" text,
	"createdByUserId" text
);
--> statement-breakpoint
CREATE TABLE "income" (
	"id" text PRIMARY KEY NOT NULL,
	"walletId" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "transactionStatus" NOT NULL,
	"paymentMethod" "transactionPaymentMethod" NOT NULL,
	"categoryId" text,
	"fixedIncomeId" text,
	"transactionDate" timestamp NOT NULL,
	"createdByUserId" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense" (
	"id" text PRIMARY KEY NOT NULL,
	"walletId" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "transactionStatus" NOT NULL,
	"paymentMethod" "transactionPaymentMethod" NOT NULL,
	"categoryId" text,
	"creditCardId" text,
	"transactionDate" timestamp NOT NULL,
	"createdByUserId" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recurring_expense" (
	"id" text PRIMARY KEY NOT NULL,
	"walletId" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "recurrentTransactionStatus" NOT NULL,
	"dayOfMonth" integer NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date,
	"paymentMethod" "transactionPaymentMethod" NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"categoryId" text,
	"creditCardId" text,
	"createdByUserId" text
);
--> statement-breakpoint
CREATE TABLE "recurring_expense_charge" (
	"id" text PRIMARY KEY NOT NULL,
	"walletId" text NOT NULL,
	"recurringExpenseId" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "transactionStatus" NOT NULL,
	"paymentMethod" "transactionPaymentMethod" NOT NULL,
	"categoryId" text,
	"creditCardId" text,
	"dueDate" timestamp NOT NULL,
	"createdByUserId" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription" (
	"id" text PRIMARY KEY NOT NULL,
	"walletId" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "recurrentTransactionStatus" NOT NULL,
	"dayOfMonth" integer NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date,
	"paymentMethod" "transactionPaymentMethod" NOT NULL,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"categoryId" text,
	"creditCardId" text,
	"createdByUserId" text
);
--> statement-breakpoint
CREATE TABLE "subscription_charge" (
	"id" text PRIMARY KEY NOT NULL,
	"walletId" text NOT NULL,
	"subscriptionId" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "transactionStatus" NOT NULL,
	"paymentMethod" "transactionPaymentMethod" NOT NULL,
	"categoryId" text,
	"creditCardId" text,
	"dueDate" timestamp NOT NULL,
	"createdByUserId" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "installment" (
	"id" text PRIMARY KEY NOT NULL,
	"walletId" text NOT NULL,
	"installmentPlanId" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "transactionStatus" NOT NULL,
	"paymentMethod" "transactionPaymentMethod" NOT NULL,
	"categoryId" text,
	"creditCardId" text,
	"installmentNumber" integer NOT NULL,
	"dueDate" timestamp NOT NULL,
	"createdByUserId" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fixed_income" ADD CONSTRAINT "fixed_income_walletId_wallet_id_fk" FOREIGN KEY ("walletId") REFERENCES "public"."wallet"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "fixed_income" ADD CONSTRAINT "fixed_income_categoryId_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "fixed_income" ADD CONSTRAINT "fixed_income_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "income" ADD CONSTRAINT "income_walletId_wallet_id_fk" FOREIGN KEY ("walletId") REFERENCES "public"."wallet"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "income" ADD CONSTRAINT "income_categoryId_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "income" ADD CONSTRAINT "income_fixedIncomeId_fixed_income_id_fk" FOREIGN KEY ("fixedIncomeId") REFERENCES "public"."fixed_income"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "income" ADD CONSTRAINT "income_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_walletId_wallet_id_fk" FOREIGN KEY ("walletId") REFERENCES "public"."wallet"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_categoryId_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_creditCardId_credit_card_id_fk" FOREIGN KEY ("creditCardId") REFERENCES "public"."credit_card"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "expense" ADD CONSTRAINT "expense_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recurring_expense" ADD CONSTRAINT "recurring_expense_walletId_wallet_id_fk" FOREIGN KEY ("walletId") REFERENCES "public"."wallet"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recurring_expense" ADD CONSTRAINT "recurring_expense_categoryId_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recurring_expense" ADD CONSTRAINT "recurring_expense_creditCardId_credit_card_id_fk" FOREIGN KEY ("creditCardId") REFERENCES "public"."credit_card"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recurring_expense" ADD CONSTRAINT "recurring_expense_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recurring_expense_charge" ADD CONSTRAINT "recurring_expense_charge_walletId_wallet_id_fk" FOREIGN KEY ("walletId") REFERENCES "public"."wallet"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recurring_expense_charge" ADD CONSTRAINT "recurring_expense_charge_recurringExpenseId_recurring_expense_id_fk" FOREIGN KEY ("recurringExpenseId") REFERENCES "public"."recurring_expense"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recurring_expense_charge" ADD CONSTRAINT "recurring_expense_charge_categoryId_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recurring_expense_charge" ADD CONSTRAINT "recurring_expense_charge_creditCardId_credit_card_id_fk" FOREIGN KEY ("creditCardId") REFERENCES "public"."credit_card"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "recurring_expense_charge" ADD CONSTRAINT "recurring_expense_charge_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_walletId_wallet_id_fk" FOREIGN KEY ("walletId") REFERENCES "public"."wallet"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_categoryId_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_creditCardId_credit_card_id_fk" FOREIGN KEY ("creditCardId") REFERENCES "public"."credit_card"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "subscription_charge" ADD CONSTRAINT "subscription_charge_walletId_wallet_id_fk" FOREIGN KEY ("walletId") REFERENCES "public"."wallet"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "subscription_charge" ADD CONSTRAINT "subscription_charge_subscriptionId_subscription_id_fk" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscription"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "subscription_charge" ADD CONSTRAINT "subscription_charge_categoryId_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "subscription_charge" ADD CONSTRAINT "subscription_charge_creditCardId_credit_card_id_fk" FOREIGN KEY ("creditCardId") REFERENCES "public"."credit_card"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "subscription_charge" ADD CONSTRAINT "subscription_charge_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "installment" ADD CONSTRAINT "installment_walletId_wallet_id_fk" FOREIGN KEY ("walletId") REFERENCES "public"."wallet"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "installment" ADD CONSTRAINT "installment_installmentPlanId_installment_plan_id_fk" FOREIGN KEY ("installmentPlanId") REFERENCES "public"."installment_plan"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "installment" ADD CONSTRAINT "installment_categoryId_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "installment" ADD CONSTRAINT "installment_creditCardId_credit_card_id_fk" FOREIGN KEY ("creditCardId") REFERENCES "public"."credit_card"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "installment" ADD CONSTRAINT "installment_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "fixed_income_wallet_idx" ON "fixed_income" USING btree ("walletId");
--> statement-breakpoint
CREATE INDEX "fixed_income_status_idx" ON "fixed_income" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "income_wallet_date_idx" ON "income" USING btree ("walletId","transactionDate");
--> statement-breakpoint
CREATE INDEX "income_fixed_income_idx" ON "income" USING btree ("fixedIncomeId");
--> statement-breakpoint
CREATE INDEX "expense_wallet_date_idx" ON "expense" USING btree ("walletId","transactionDate");
--> statement-breakpoint
CREATE INDEX "expense_category_idx" ON "expense" USING btree ("categoryId");
--> statement-breakpoint
CREATE INDEX "recurring_expense_wallet_idx" ON "recurring_expense" USING btree ("walletId");
--> statement-breakpoint
CREATE INDEX "recurring_expense_status_idx" ON "recurring_expense" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "recurring_expense_charge_plan_date_idx" ON "recurring_expense_charge" USING btree ("recurringExpenseId","dueDate");
--> statement-breakpoint
CREATE INDEX "recurring_expense_charge_wallet_date_idx" ON "recurring_expense_charge" USING btree ("walletId","dueDate");
--> statement-breakpoint
CREATE INDEX "subscription_wallet_idx" ON "subscription" USING btree ("walletId");
--> statement-breakpoint
CREATE INDEX "subscription_status_idx" ON "subscription" USING btree ("status");
--> statement-breakpoint
CREATE INDEX "subscription_charge_plan_date_idx" ON "subscription_charge" USING btree ("subscriptionId","dueDate");
--> statement-breakpoint
CREATE INDEX "subscription_charge_wallet_date_idx" ON "subscription_charge" USING btree ("walletId","dueDate");
--> statement-breakpoint
CREATE INDEX "installment_plan_number_idx" ON "installment" USING btree ("installmentPlanId","installmentNumber");
--> statement-breakpoint
CREATE INDEX "installment_wallet_date_idx" ON "installment" USING btree ("walletId","dueDate");
--> statement-breakpoint
INSERT INTO "fixed_income" ("id", "walletId", "description", "amount", "status", "dayOfMonth", "startDate", "endDate", "paymentMethod", "notes", "createdAt", "updatedAt", "categoryId", "createdByUserId")
SELECT "id", "walletId", "description", "amount", "status", "dayOfMonth", "startDate", "endDate", "paymentMethod", "notes", "createdAt", "updatedAt", "categoryId", "createdByUserId"
FROM "recurrent_transaction"
WHERE "recurrenceKind" = 'fixed_income';
--> statement-breakpoint
INSERT INTO "subscription" ("id", "walletId", "description", "amount", "status", "dayOfMonth", "startDate", "endDate", "paymentMethod", "notes", "createdAt", "updatedAt", "categoryId", "creditCardId", "createdByUserId")
SELECT "id", "walletId", "description", "amount", "status", "dayOfMonth", "startDate", "endDate", "paymentMethod", "notes", "createdAt", "updatedAt", "categoryId", "creditCardId", "createdByUserId"
FROM "recurrent_transaction"
WHERE "recurrenceKind" = 'subscription';
--> statement-breakpoint
INSERT INTO "recurring_expense" ("id", "walletId", "description", "amount", "status", "dayOfMonth", "startDate", "endDate", "paymentMethod", "notes", "createdAt", "updatedAt", "categoryId", "creditCardId", "createdByUserId")
SELECT "id", "walletId", "description", "amount", "status", "dayOfMonth", "startDate", "endDate", "paymentMethod", "notes", "createdAt", "updatedAt", "categoryId", "creditCardId", "createdByUserId"
FROM "recurrent_transaction"
WHERE "recurrenceKind" = 'recurring_expense';
--> statement-breakpoint
INSERT INTO "income" ("id", "walletId", "description", "amount", "status", "paymentMethod", "categoryId", "fixedIncomeId", "transactionDate", "createdByUserId", "notes", "createdAt", "updatedAt")
SELECT t."id", t."walletId", t."description", t."amount", t."status", t."paymentMethod", t."categoryId",
	CASE WHEN r."recurrenceKind" = 'fixed_income' THEN t."recurrentTransactionId" ELSE NULL END,
	t."transactionDate", t."createdByUserId", t."notes", t."createdAt", t."updatedAt"
FROM "transaction" t
LEFT JOIN "recurrent_transaction" r ON r."id" = t."recurrentTransactionId"
WHERE t."type" = 'income';
--> statement-breakpoint
INSERT INTO "expense" ("id", "walletId", "description", "amount", "status", "paymentMethod", "categoryId", "creditCardId", "transactionDate", "createdByUserId", "notes", "createdAt", "updatedAt")
SELECT "id", "walletId", "description", "amount", "status", "paymentMethod", "categoryId", "creditCardId", "transactionDate", "createdByUserId", "notes", "createdAt", "updatedAt"
FROM "transaction"
WHERE "type" = 'expense'
	AND "installmentPlanId" IS NULL
	AND "recurrentTransactionId" IS NULL;
--> statement-breakpoint
INSERT INTO "subscription_charge" ("id", "walletId", "subscriptionId", "description", "amount", "status", "paymentMethod", "categoryId", "creditCardId", "dueDate", "createdByUserId", "notes", "createdAt", "updatedAt")
SELECT t."id", t."walletId", t."recurrentTransactionId", t."description", t."amount", t."status", t."paymentMethod", t."categoryId", t."creditCardId", t."transactionDate", t."createdByUserId", t."notes", t."createdAt", t."updatedAt"
FROM "transaction" t
INNER JOIN "recurrent_transaction" r ON r."id" = t."recurrentTransactionId"
WHERE r."recurrenceKind" = 'subscription';
--> statement-breakpoint
INSERT INTO "recurring_expense_charge" ("id", "walletId", "recurringExpenseId", "description", "amount", "status", "paymentMethod", "categoryId", "creditCardId", "dueDate", "createdByUserId", "notes", "createdAt", "updatedAt")
SELECT t."id", t."walletId", t."recurrentTransactionId", t."description", t."amount", t."status", t."paymentMethod", t."categoryId", t."creditCardId", t."transactionDate", t."createdByUserId", t."notes", t."createdAt", t."updatedAt"
FROM "transaction" t
INNER JOIN "recurrent_transaction" r ON r."id" = t."recurrentTransactionId"
WHERE r."recurrenceKind" = 'recurring_expense';
--> statement-breakpoint
INSERT INTO "installment" ("id", "walletId", "installmentPlanId", "description", "amount", "status", "paymentMethod", "categoryId", "creditCardId", "installmentNumber", "dueDate", "createdByUserId", "notes", "createdAt", "updatedAt")
SELECT "id", "walletId", "installmentPlanId", "description", "amount", "status", "paymentMethod", "categoryId", "creditCardId", COALESCE("installmentNumber", 1), "transactionDate", "createdByUserId", "notes", "createdAt", "updatedAt"
FROM "transaction"
WHERE "installmentPlanId" IS NOT NULL;
--> statement-breakpoint
DROP TABLE "transaction";
--> statement-breakpoint
DROP TABLE "recurrent_transaction";
--> statement-breakpoint
DROP TYPE "public"."transactionType";
--> statement-breakpoint
DROP TYPE "public"."recurrenceKind";
--> statement-breakpoint
DROP TYPE "public"."recurrentTransactionFrequency";
