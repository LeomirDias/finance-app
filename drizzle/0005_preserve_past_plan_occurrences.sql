ALTER TABLE "recurring_expense_charge" DROP CONSTRAINT "recurring_expense_charge_recurringExpenseId_recurring_expense_id_fk";
--> statement-breakpoint
ALTER TABLE "recurring_expense_charge" ALTER COLUMN "recurringExpenseId" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "recurring_expense_charge" ADD CONSTRAINT "recurring_expense_charge_recurringExpenseId_recurring_expense_id_fk" FOREIGN KEY ("recurringExpenseId") REFERENCES "public"."recurring_expense"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "subscription_charge" DROP CONSTRAINT "subscription_charge_subscriptionId_subscription_id_fk";
--> statement-breakpoint
ALTER TABLE "subscription_charge" ALTER COLUMN "subscriptionId" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "subscription_charge" ADD CONSTRAINT "subscription_charge_subscriptionId_subscription_id_fk" FOREIGN KEY ("subscriptionId") REFERENCES "public"."subscription"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "installment" DROP CONSTRAINT "installment_installmentPlanId_installment_plan_id_fk";
--> statement-breakpoint
ALTER TABLE "installment" ALTER COLUMN "installmentPlanId" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "installment" ADD CONSTRAINT "installment_installmentPlanId_installment_plan_id_fk" FOREIGN KEY ("installmentPlanId") REFERENCES "public"."installment_plan"("id") ON DELETE set null ON UPDATE no action;
