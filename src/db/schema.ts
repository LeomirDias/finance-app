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

export const transactionType = pgEnum("transactionType", ["income", "expense"]);

export const transactionStatus = pgEnum("transactionStatus", [
  "pending",
  "paid",
  "received",
  "canceled",
]);

export const transactionPaymentMethod = pgEnum("transactionPaymentMethod", [
  "credit_card",
  "debit_card",
  "pix",
  "bank_transfer",
  "cash",
]);

export const recurrentTransactionStatus = pgEnum("recurrentTransactionStatus", [
  "active",
  "inactive",
]);

export const recurrentTransactionFrequency = pgEnum(
  "recurrentTransactionFrequency",
  ["monthly"],
);

export const recurrenceKind = pgEnum("recurrenceKind", [
  "subscription",
  "recurring_expense",
  "fixed_income",
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
    paymentMethod: transactionPaymentMethod("paymentMethod").notNull(),
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

export const recurrentTransactions = pgTable(
  "recurrent_transaction",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    walletId: text("walletId")
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    type: transactionType("type").notNull(),
    status: recurrentTransactionStatus("status").notNull(),
    recurrenceKind: recurrenceKind("recurrenceKind").notNull(),
    frequency: recurrentTransactionFrequency("frequency")
      .notNull()
      .default("monthly"),
    dayOfMonth: integer("dayOfMonth").notNull(),
    startDate: date("startDate", { mode: "date" }).notNull(),
    endDate: date("endDate", { mode: "date" }),
    paymentMethod: transactionPaymentMethod("paymentMethod").notNull(),
    categoryId: text("categoryId").references(() => categories.id, {
      onDelete: "set null",
    }),
    creditCardId: text("creditCardId").references(() => creditCards.id, {
      onDelete: "set null",
    }),
    createdByUserId: text("createdByUserId").references(() => users.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    walletIdx: index("recurrent_transaction_wallet_idx").on(table.walletId),
    statusIdx: index("recurrent_transaction_status_idx").on(table.status),
    kindIdx: index("recurrent_transaction_kind_idx").on(table.recurrenceKind),
  }),
);

export const transactions = pgTable(
  "transaction",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    walletId: text("walletId")
      .notNull()
      .references(() => wallets.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    type: transactionType("type").notNull(),
    status: transactionStatus("status").notNull(),
    paymentMethod: transactionPaymentMethod("paymentMethod").notNull(),
    categoryId: text("categoryId").references(() => categories.id, {
      onDelete: "set null",
    }),
    creditCardId: text("creditCardId").references(() => creditCards.id, {
      onDelete: "set null",
    }),
    recurrentTransactionId: text("recurrentTransactionId").references(
      () => recurrentTransactions.id,
      { onDelete: "set null" },
    ),
    installmentPlanId: text("installmentPlanId").references(
      () => installmentPlans.id,
      { onDelete: "cascade" },
    ),
    installmentNumber: integer("installmentNumber"),
    transactionDate: timestamp("transactionDate", { mode: "date" }).notNull(),
    createdByUserId: text("createdByUserId").references(() => users.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    createdAt: timestamp("createdAt", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    walletDateIdx: index("transaction_wallet_date_idx").on(
      table.walletId,
      table.transactionDate,
    ),
    walletTypeIdx: index("transaction_wallet_type_idx").on(
      table.walletId,
      table.type,
    ),
    categoryIdx: index("transaction_category_idx").on(table.categoryId),
    recurrentIdx: index("transaction_recurrent_idx").on(
      table.recurrentTransactionId,
    ),
    installmentIdx: index("transaction_installment_idx").on(
      table.installmentPlanId,
    ),
  }),
);

/*** Relações ***/

export const usersRelations = relations(users, ({ many }) => ({
  walletMemberships: many(walletsMembers),
  createdTransactions: many(transactions),
  createdRecurrentTransactions: many(recurrentTransactions),
  createdInstallmentPlans: many(installmentPlans),
}));

export const walletsRelations = relations(wallets, ({ many }) => ({
  members: many(walletsMembers),
  categories: many(categories),
  creditCards: many(creditCards),
  transactions: many(transactions),
  recurrentTransactions: many(recurrentTransactions),
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
  transactions: many(transactions),
  recurrentTransactions: many(recurrentTransactions),
  installmentPlans: many(installmentPlans),
}));

export const creditCardsRelations = relations(creditCards, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [creditCards.walletId],
    references: [wallets.id],
  }),
  transactions: many(transactions),
  recurrentTransactions: many(recurrentTransactions),
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
    transactions: many(transactions),
  }),
);

export const recurrentTransactionsRelations = relations(
  recurrentTransactions,
  ({ one, many }) => ({
    wallet: one(wallets, {
      fields: [recurrentTransactions.walletId],
      references: [wallets.id],
    }),
    category: one(categories, {
      fields: [recurrentTransactions.categoryId],
      references: [categories.id],
    }),
    creditCard: one(creditCards, {
      fields: [recurrentTransactions.creditCardId],
      references: [creditCards.id],
    }),
    createdBy: one(users, {
      fields: [recurrentTransactions.createdByUserId],
      references: [users.id],
    }),
    transactions: many(transactions),
  }),
);

export const transactionsRelations = relations(transactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  creditCard: one(creditCards, {
    fields: [transactions.creditCardId],
    references: [creditCards.id],
  }),
  recurrentTransaction: one(recurrentTransactions, {
    fields: [transactions.recurrentTransactionId],
    references: [recurrentTransactions.id],
  }),
  installmentPlan: one(installmentPlans, {
    fields: [transactions.installmentPlanId],
    references: [installmentPlans.id],
  }),
  createdBy: one(users, {
    fields: [transactions.createdByUserId],
    references: [users.id],
  }),
}));
