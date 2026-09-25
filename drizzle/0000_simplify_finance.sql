CREATE TYPE "public"."categoryType" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."installmentPlanStatus" AS ENUM('active', 'completed', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."recurrenceKind" AS ENUM('subscription', 'recurring_expense', 'fixed_income');--> statement-breakpoint
CREATE TYPE "public"."recurrentTransactionFrequency" AS ENUM('monthly');--> statement-breakpoint
CREATE TYPE "public"."recurrentTransactionStatus" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."status" AS ENUM('active', 'inactive', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."transactionPaymentMethod" AS ENUM('credit_card', 'debit_card', 'pix', 'bank_transfer', 'cash');--> statement-breakpoint
CREATE TYPE "public"."transactionStatus" AS ENUM('pending', 'paid', 'received', 'canceled');--> statement-breakpoint
CREATE TYPE "public"."transactionType" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "authenticator" (
	"credentialID" text NOT NULL,
	"userId" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"credentialPublicKey" text NOT NULL,
	"counter" integer NOT NULL,
	"credentialDeviceType" text NOT NULL,
	"credentialBackedUp" boolean NOT NULL,
	"transports" text,
	CONSTRAINT "authenticator_userId_credentialID_pk" PRIMARY KEY("userId","credentialID"),
	CONSTRAINT "authenticator_credentialID_unique" UNIQUE("credentialID")
);
--> statement-breakpoint
CREATE TABLE "category" (
	"id" text PRIMARY KEY NOT NULL,
	"walletId" text NOT NULL,
	"name" text NOT NULL,
	"type" "categoryType" NOT NULL,
	"icon" text,
	"color" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_card" (
	"id" text PRIMARY KEY NOT NULL,
	"walletId" text NOT NULL,
	"name" text NOT NULL,
	"institution" text,
	"status" "status" DEFAULT 'active' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "installment_plan" (
	"id" text PRIMARY KEY NOT NULL,
	"walletId" text NOT NULL,
	"description" text NOT NULL,
	"totalAmount" numeric(10, 2) NOT NULL,
	"installmentAmount" numeric(10, 2) NOT NULL,
	"totalInstallments" integer NOT NULL,
	"paidInstallments" integer DEFAULT 0 NOT NULL,
	"categoryId" text,
	"paymentMethod" "transactionPaymentMethod" NOT NULL,
	"creditCardId" text,
	"firstDueDate" date NOT NULL,
	"status" "installmentPlanStatus" NOT NULL,
	"createdByUserId" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_token" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"token" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "recurrent_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"walletId" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"type" "transactionType" NOT NULL,
	"status" "recurrentTransactionStatus" NOT NULL,
	"recurrenceKind" "recurrenceKind" NOT NULL,
	"frequency" "recurrentTransactionFrequency" DEFAULT 'monthly' NOT NULL,
	"dayOfMonth" integer NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date,
	"paymentMethod" "transactionPaymentMethod" NOT NULL,
	"categoryId" text,
	"creditCardId" text,
	"createdByUserId" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"walletId" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"type" "transactionType" NOT NULL,
	"status" "transactionStatus" NOT NULL,
	"paymentMethod" "transactionPaymentMethod" NOT NULL,
	"categoryId" text,
	"creditCardId" text,
	"recurrentTransactionId" text,
	"installmentPlanId" text,
	"installmentNumber" integer,
	"transactionDate" timestamp NOT NULL,
	"createdByUserId" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text,
	"password" text,
	"activeWalletId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "wallet" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" "status" NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wallets_members" (
	"id" text PRIMARY KEY NOT NULL,
	"walletId" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authenticator" ADD CONSTRAINT "authenticator_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_walletId_wallet_id_fk" FOREIGN KEY ("walletId") REFERENCES "public"."wallet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_card" ADD CONSTRAINT "credit_card_walletId_wallet_id_fk" FOREIGN KEY ("walletId") REFERENCES "public"."wallet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_plan" ADD CONSTRAINT "installment_plan_walletId_wallet_id_fk" FOREIGN KEY ("walletId") REFERENCES "public"."wallet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_plan" ADD CONSTRAINT "installment_plan_categoryId_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_plan" ADD CONSTRAINT "installment_plan_creditCardId_credit_card_id_fk" FOREIGN KEY ("creditCardId") REFERENCES "public"."credit_card"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "installment_plan" ADD CONSTRAINT "installment_plan_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurrent_transaction" ADD CONSTRAINT "recurrent_transaction_walletId_wallet_id_fk" FOREIGN KEY ("walletId") REFERENCES "public"."wallet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurrent_transaction" ADD CONSTRAINT "recurrent_transaction_categoryId_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurrent_transaction" ADD CONSTRAINT "recurrent_transaction_creditCardId_credit_card_id_fk" FOREIGN KEY ("creditCardId") REFERENCES "public"."credit_card"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurrent_transaction" ADD CONSTRAINT "recurrent_transaction_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_walletId_wallet_id_fk" FOREIGN KEY ("walletId") REFERENCES "public"."wallet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_categoryId_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_creditCardId_credit_card_id_fk" FOREIGN KEY ("creditCardId") REFERENCES "public"."credit_card"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_recurrentTransactionId_recurrent_transaction_id_fk" FOREIGN KEY ("recurrentTransactionId") REFERENCES "public"."recurrent_transaction"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_installmentPlanId_installment_plan_id_fk" FOREIGN KEY ("installmentPlanId") REFERENCES "public"."installment_plan"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_createdByUserId_user_id_fk" FOREIGN KEY ("createdByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_activeWalletId_wallet_id_fk" FOREIGN KEY ("activeWalletId") REFERENCES "public"."wallet"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets_members" ADD CONSTRAINT "wallets_members_walletId_wallet_id_fk" FOREIGN KEY ("walletId") REFERENCES "public"."wallet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallets_members" ADD CONSTRAINT "wallets_members_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "category_wallet_name_type_idx" ON "category" USING btree ("walletId","name","type");--> statement-breakpoint
CREATE INDEX "category_wallet_idx" ON "category" USING btree ("walletId");--> statement-breakpoint
CREATE INDEX "credit_card_wallet_idx" ON "credit_card" USING btree ("walletId");--> statement-breakpoint
CREATE INDEX "installment_plan_wallet_idx" ON "installment_plan" USING btree ("walletId");--> statement-breakpoint
CREATE INDEX "installment_plan_status_idx" ON "installment_plan" USING btree ("status");--> statement-breakpoint
CREATE INDEX "recurrent_transaction_wallet_idx" ON "recurrent_transaction" USING btree ("walletId");--> statement-breakpoint
CREATE INDEX "recurrent_transaction_status_idx" ON "recurrent_transaction" USING btree ("status");--> statement-breakpoint
CREATE INDEX "recurrent_transaction_kind_idx" ON "recurrent_transaction" USING btree ("recurrenceKind");--> statement-breakpoint
CREATE INDEX "transaction_wallet_date_idx" ON "transaction" USING btree ("walletId","transactionDate");--> statement-breakpoint
CREATE INDEX "transaction_wallet_type_idx" ON "transaction" USING btree ("walletId","type");--> statement-breakpoint
CREATE INDEX "transaction_category_idx" ON "transaction" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "transaction_recurrent_idx" ON "transaction" USING btree ("recurrentTransactionId");--> statement-breakpoint
CREATE INDEX "transaction_installment_idx" ON "transaction" USING btree ("installmentPlanId");--> statement-breakpoint
CREATE UNIQUE INDEX "wallets_members_wallet_user_idx" ON "wallets_members" USING btree ("walletId","userId");