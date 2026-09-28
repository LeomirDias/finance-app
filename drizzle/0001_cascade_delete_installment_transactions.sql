ALTER TABLE "transaction" DROP CONSTRAINT "transaction_installmentPlanId_installment_plan_id_fk";
--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_installmentPlanId_installment_plan_id_fk" FOREIGN KEY ("installmentPlanId") REFERENCES "public"."installment_plan"("id") ON DELETE cascade ON UPDATE no action;