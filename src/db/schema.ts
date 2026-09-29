import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  numeric,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "@auth/core/adapters";

export const statusEnum = pgEnum("status", ["active", "inactive", "blocked"]);

export const entryStatus = pgEnum("transactionStatus", [
  "pending",
  "paid",
  "received",
  "canceled",
]);

export const paymentMethod = pgEnum("transactionPaymentMethod", [
  "credit_card",
  "debit_card",
  "pix",
  "bank_transfer",
  "cash",
]);

export const planStatus = pgEnum("recurrentTransactionStatus", [
  "active",
  "inactive",
]);

export const categoryType = pgEnum("categoryType", ["income", "expense"]);

export const installmentPlanStatus = pgEnum("installmentPlanStatus", [
  "active",
  "completed",
  "canceled",
]);

export const users = pgTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  password: text("password"),
  activeWalletId: text("activeWalletId").references(() => wallets.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compositePk: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  }),
);

export const authenticators = pgTable(
  "authenticator",
  {
    credentialID: text("credentialID").notNull().unique(),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerAccountId: text("providerAccountId").notNull(),
    credentialPublicKey: text("credentialPublicKey").notNull(),
    counter: integer("counter").notNull(),
    credentialDeviceType: text("credentialDeviceType").notNull(),
    credentialBackedUp: boolean("credentialBackedUp").notNull(),
    transports: text("transports"),
  },
  (authenticator) => ({
    compositePk: primaryKey({
      columns: [authenticator.userId, authenticator.credentialID],
    }),
  }),
);

export const passwordResetTokens = pgTable("password_reset_token", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expiresAt", { mode: "date" }).notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
});

/*** Estrutura financeira ***/

export const wallets = pgTable("wallet", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  status: statusEnum("status").notNull(),
  createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
});

export const walletsMembers = pgTable(
  "wallets_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    walletId: text("walletId")
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    walletUserUnique: uniqueIndex("wallets_members_wallet_user_idx").on(
      table.walletId,
      table.userId,
    ),
  }),
);

export const categories = pgTable(
  "category",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    walletId: text("walletId")
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: categoryType("type").notNull(),
    icon: text("icon"),
    color: text("color"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    walletNameUnique: uniqueIndex("category_wallet_name_type_idx").on(
      table.walletId,
      table.name,
      table.type,
    ),
    walletIdx: index("category_wallet_idx").on(table.walletId),
  }),
);

export const creditCards = pgTable(
  "credit_card",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    walletId: text("walletId")
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    institution: text("institution"),
    status: statusEnum("status").notNull().default("active"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    walletIdx: index("credit_card_wallet_idx").on(table.walletId),
  }),
);

export const installmentPlans = pgTable(
  "installment_plan",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    walletId: text("walletId")
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    totalAmount: numeric("totalAmount", { precision: 10, scale: 2 }).notNull(),
    installmentAmount: numeric("installmentAmount", {
      precision: 10,
      scale: 2,
    }).notNull(),
    totalInstallments: integer("totalInstallments").notNull(),
    paidInstallments: integer("paidInstallments").default(0).notNull(),
    categoryId: text("categoryId").references(() => categories.id, {
      onDelete: "set null",
    }),
    paymentMethod: paymentMethod("paymentMethod").notNull(),
    creditCardId: text("creditCardId").references(() => creditCards.id, {
      onDelete: "set null",
    }),
    firstDueDate: date("firstDueDate", { mode: "date" }).notNull(),
    status: installmentPlanStatus("status").notNull(),
    createdByUserId: text("createdByUserId").references(() => users.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    walletIdx: index("installment_plan_wallet_idx").on(table.walletId),
    statusIdx: index("installment_plan_status_idx").on(table.status),
  }),
);

function planFields() {
  return {
    description: text("description").notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    status: planStatus("status").notNull(),
    dayOfMonth: integer("dayOfMonth").notNull(),
    startDate: date("startDate", { mode: "date" }).notNull(),
    endDate: date("endDate", { mode: "date" }),
    paymentMethod: paymentMethod("paymentMethod").notNull(),
    notes: text("notes"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  };
}

export const fixedIncomes = pgTable(
  "fixed_income",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    walletId: text("walletId")
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
    ...planFields(),
    categoryId: text("categoryId").references(() => categories.id, {
      onDelete: "set null",
    }),
    createdByUserId: text("createdByUserId").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => ({
    walletIdx: index("fixed_income_wallet_idx").on(table.walletId),
    statusIdx: index("fixed_income_status_idx").on(table.status),
  }),
);

export const incomes = pgTable(
  "income",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    walletId: text("walletId")
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    status: entryStatus("status").notNull(),
    paymentMethod: paymentMethod("paymentMethod").notNull(),
    categoryId: text("categoryId").references(() => categories.id, {
      onDelete: "set null",
    }),
    fixedIncomeId: text("fixedIncomeId").references(() => fixedIncomes.id, {
      onDelete: "set null",
    }),
    transactionDate: timestamp("transactionDate", { mode: "date" }).notNull(),
    createdByUserId: text("createdByUserId").references(() => users.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    walletDateIdx: index("income_wallet_date_idx").on(
      table.walletId,
      table.transactionDate,
    ),
    fixedIncomeIdx: index("income_fixed_income_idx").on(table.fixedIncomeId),
  }),
);

export const expenses = pgTable(
  "expense",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    walletId: text("walletId")
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    status: entryStatus("status").notNull(),
    paymentMethod: paymentMethod("paymentMethod").notNull(),
    categoryId: text("categoryId").references(() => categories.id, {
      onDelete: "set null",
    }),
    creditCardId: text("creditCardId").references(() => creditCards.id, {
      onDelete: "set null",
    }),
    transactionDate: timestamp("transactionDate", { mode: "date" }).notNull(),
    createdByUserId: text("createdByUserId").references(() => users.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    walletDateIdx: index("expense_wallet_date_idx").on(
      table.walletId,
      table.transactionDate,
    ),
    categoryIdx: index("expense_category_idx").on(table.categoryId),
  }),
);

export const recurringExpenses = pgTable(
  "recurring_expense",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    walletId: text("walletId")
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
    ...planFields(),
    categoryId: text("categoryId").references(() => categories.id, {
      onDelete: "set null",
    }),
    creditCardId: text("creditCardId").references(() => creditCards.id, {
      onDelete: "set null",
    }),
    createdByUserId: text("createdByUserId").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => ({
    walletIdx: index("recurring_expense_wallet_idx").on(table.walletId),
    statusIdx: index("recurring_expense_status_idx").on(table.status),
  }),
);

export const recurringExpenseCharges = pgTable(
  "recurring_expense_charge",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    walletId: text("walletId")
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
    recurringExpenseId: text("recurringExpenseId")
      .notNull()
      .references(() => recurringExpenses.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    status: entryStatus("status").notNull(),
    paymentMethod: paymentMethod("paymentMethod").notNull(),
    categoryId: text("categoryId").references(() => categories.id, {
      onDelete: "set null",
    }),
    creditCardId: text("creditCardId").references(() => creditCards.id, {
      onDelete: "set null",
    }),
    dueDate: timestamp("dueDate", { mode: "date" }).notNull(),
    createdByUserId: text("createdByUserId").references(() => users.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    planDateIdx: index("recurring_expense_charge_plan_date_idx").on(
      table.recurringExpenseId,
      table.dueDate,
    ),
    walletDateIdx: index("recurring_expense_charge_wallet_date_idx").on(
      table.walletId,
      table.dueDate,
    ),
  }),
);

export const subscriptions = pgTable(
  "subscription",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    walletId: text("walletId")
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
    ...planFields(),
    categoryId: text("categoryId").references(() => categories.id, {
      onDelete: "set null",
    }),
    creditCardId: text("creditCardId").references(() => creditCards.id, {
      onDelete: "set null",
    }),
    createdByUserId: text("createdByUserId").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => ({
    walletIdx: index("subscription_wallet_idx").on(table.walletId),
    statusIdx: index("subscription_status_idx").on(table.status),
  }),
);

export const subscriptionCharges = pgTable(
  "subscription_charge",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    walletId: text("walletId")
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
    subscriptionId: text("subscriptionId")
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    status: entryStatus("status").notNull(),
    paymentMethod: paymentMethod("paymentMethod").notNull(),
    categoryId: text("categoryId").references(() => categories.id, {
      onDelete: "set null",
    }),
    creditCardId: text("creditCardId").references(() => creditCards.id, {
      onDelete: "set null",
    }),
    dueDate: timestamp("dueDate", { mode: "date" }).notNull(),
    createdByUserId: text("createdByUserId").references(() => users.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    planDateIdx: index("subscription_charge_plan_date_idx").on(
      table.subscriptionId,
      table.dueDate,
    ),
    walletDateIdx: index("subscription_charge_wallet_date_idx").on(
      table.walletId,
      table.dueDate,
    ),
  }),
);

export const installments = pgTable(
  "installment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    walletId: text("walletId")
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
    installmentPlanId: text("installmentPlanId")
      .notNull()
      .references(() => installmentPlans.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    status: entryStatus("status").notNull(),
    paymentMethod: paymentMethod("paymentMethod").notNull(),
    categoryId: text("categoryId").references(() => categories.id, {
      onDelete: "set null",
    }),
    creditCardId: text("creditCardId").references(() => creditCards.id, {
      onDelete: "set null",
    }),
    installmentNumber: integer("installmentNumber").notNull(),
    dueDate: timestamp("dueDate", { mode: "date" }).notNull(),
    createdByUserId: text("createdByUserId").references(() => users.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    planNumberIdx: index("installment_plan_number_idx").on(
      table.installmentPlanId,
      table.installmentNumber,
    ),
    walletDateIdx: index("installment_wallet_date_idx").on(
      table.walletId,
      table.dueDate,
    ),
  }),
);

/*** Relações ***/

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  authenticators: many(authenticators),
  walletMemberships: many(walletsMembers),
  createdIncomes: many(incomes),
  createdFixedIncomes: many(fixedIncomes),
  createdExpenses: many(expenses),
  createdRecurringExpenses: many(recurringExpenses),
  createdSubscriptions: many(subscriptions),
  createdInstallmentPlans: many(installmentPlans),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const authenticatorsRelations = relations(authenticators, ({ one }) => ({
  user: one(users, {
    fields: [authenticators.userId],
    references: [users.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ many }) => ({
  members: many(walletsMembers),
  categories: many(categories),
  creditCards: many(creditCards),
  incomes: many(incomes),
  fixedIncomes: many(fixedIncomes),
  expenses: many(expenses),
  recurringExpenses: many(recurringExpenses),
  subscriptions: many(subscriptions),
  installmentPlans: many(installmentPlans),
}));

export const walletsMembersRelations = relations(walletsMembers, ({ one }) => ({
  wallet: one(wallets, {
    fields: [walletsMembers.walletId],
    references: [wallets.id],
  }),
  user: one(users, {
    fields: [walletsMembers.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [categories.walletId],
    references: [wallets.id],
  }),
  incomes: many(incomes),
  fixedIncomes: many(fixedIncomes),
  expenses: many(expenses),
  recurringExpenses: many(recurringExpenses),
  subscriptions: many(subscriptions),
  installmentPlans: many(installmentPlans),
}));

export const creditCardsRelations = relations(creditCards, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [creditCards.walletId],
    references: [wallets.id],
  }),
  expenses: many(expenses),
  recurringExpenses: many(recurringExpenses),
  subscriptions: many(subscriptions),
  installmentPlans: many(installmentPlans),
}));

export const installmentPlansRelations = relations(
  installmentPlans,
  ({ one, many }) => ({
    wallet: one(wallets, {
      fields: [installmentPlans.walletId],
      references: [wallets.id],
    }),
    category: one(categories, {
      fields: [installmentPlans.categoryId],
      references: [categories.id],
    }),
    creditCard: one(creditCards, {
      fields: [installmentPlans.creditCardId],
      references: [creditCards.id],
    }),
    createdBy: one(users, {
      fields: [installmentPlans.createdByUserId],
      references: [users.id],
    }),
    installments: many(installments),
  }),
);

export const fixedIncomesRelations = relations(
  fixedIncomes,
  ({ one, many }) => ({
    wallet: one(wallets, {
      fields: [fixedIncomes.walletId],
      references: [wallets.id],
    }),
    category: one(categories, {
      fields: [fixedIncomes.categoryId],
      references: [categories.id],
    }),
    createdBy: one(users, {
      fields: [fixedIncomes.createdByUserId],
      references: [users.id],
    }),
    incomes: many(incomes),
  }),
);

export const incomesRelations = relations(incomes, ({ one }) => ({
  wallet: one(wallets, {
    fields: [incomes.walletId],
    references: [wallets.id],
  }),
  category: one(categories, {
    fields: [incomes.categoryId],
    references: [categories.id],
  }),
  fixedIncome: one(fixedIncomes, {
    fields: [incomes.fixedIncomeId],
    references: [fixedIncomes.id],
  }),
  createdBy: one(users, {
    fields: [incomes.createdByUserId],
    references: [users.id],
  }),
}));

export const expensesRelations = relations(expenses, ({ one }) => ({
  wallet: one(wallets, {
    fields: [expenses.walletId],
    references: [wallets.id],
  }),
  category: one(categories, {
    fields: [expenses.categoryId],
    references: [categories.id],
  }),
  creditCard: one(creditCards, {
    fields: [expenses.creditCardId],
    references: [creditCards.id],
  }),
  createdBy: one(users, {
    fields: [expenses.createdByUserId],
    references: [users.id],
  }),
}));

export const recurringExpensesRelations = relations(
  recurringExpenses,
  ({ one, many }) => ({
    wallet: one(wallets, {
      fields: [recurringExpenses.walletId],
      references: [wallets.id],
    }),
    category: one(categories, {
      fields: [recurringExpenses.categoryId],
      references: [categories.id],
    }),
    creditCard: one(creditCards, {
      fields: [recurringExpenses.creditCardId],
      references: [creditCards.id],
    }),
    createdBy: one(users, {
      fields: [recurringExpenses.createdByUserId],
      references: [users.id],
    }),
    charges: many(recurringExpenseCharges),
  }),
);

export const recurringExpenseChargesRelations = relations(
  recurringExpenseCharges,
  ({ one }) => ({
    wallet: one(wallets, {
      fields: [recurringExpenseCharges.walletId],
      references: [wallets.id],
    }),
    recurringExpense: one(recurringExpenses, {
      fields: [recurringExpenseCharges.recurringExpenseId],
      references: [recurringExpenses.id],
    }),
    category: one(categories, {
      fields: [recurringExpenseCharges.categoryId],
      references: [categories.id],
    }),
    creditCard: one(creditCards, {
      fields: [recurringExpenseCharges.creditCardId],
      references: [creditCards.id],
    }),
    createdBy: one(users, {
      fields: [recurringExpenseCharges.createdByUserId],
      references: [users.id],
    }),
  }),
);

export const subscriptionsRelations = relations(
  subscriptions,
  ({ one, many }) => ({
    wallet: one(wallets, {
      fields: [subscriptions.walletId],
      references: [wallets.id],
    }),
    category: one(categories, {
      fields: [subscriptions.categoryId],
      references: [categories.id],
    }),
    creditCard: one(creditCards, {
      fields: [subscriptions.creditCardId],
      references: [creditCards.id],
    }),
    createdBy: one(users, {
      fields: [subscriptions.createdByUserId],
      references: [users.id],
    }),
    charges: many(subscriptionCharges),
  }),
);

export const subscriptionChargesRelations = relations(
  subscriptionCharges,
  ({ one }) => ({
    wallet: one(wallets, {
      fields: [subscriptionCharges.walletId],
      references: [wallets.id],
    }),
    subscription: one(subscriptions, {
      fields: [subscriptionCharges.subscriptionId],
      references: [subscriptions.id],
    }),
    category: one(categories, {
      fields: [subscriptionCharges.categoryId],
      references: [categories.id],
    }),
    creditCard: one(creditCards, {
      fields: [subscriptionCharges.creditCardId],
      references: [creditCards.id],
    }),
    createdBy: one(users, {
      fields: [subscriptionCharges.createdByUserId],
      references: [users.id],
    }),
  }),
);

export const installmentsRelations = relations(installments, ({ one }) => ({
  wallet: one(wallets, {
    fields: [installments.walletId],
    references: [wallets.id],
  }),
  plan: one(installmentPlans, {
    fields: [installments.installmentPlanId],
    references: [installmentPlans.id],
  }),
  category: one(categories, {
    fields: [installments.categoryId],
    references: [categories.id],
  }),
  creditCard: one(creditCards, {
    fields: [installments.creditCardId],
    references: [creditCards.id],
  }),
  createdBy: one(users, {
    fields: [installments.createdByUserId],
    references: [users.id],
  }),
}));
