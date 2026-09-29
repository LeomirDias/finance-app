"use server";

import { and, desc, eq, gte, ilike, lte, ne, SQL } from "drizzle-orm";

import { db } from "@/src/db";
import {
  categories,
  creditCards,
  installmentPlans,
  recurrentTransactions,
  transactions,
} from "@/src/db/schema";
import { requireActiveWallet } from "@/src/lib/require-active-wallet";
import { requireSession } from "@/src/lib/require-session";
import {
  ensureRecurrentOccurrences,
  getMonthOverview,
} from "@/src/lib/finance/month-summary";
import {
  formatYearMonth,
  getMonthRange,
  parseDateOnly,
  parseYearMonth,
  toNumber,
} from "@/src/lib/finance/dates";
import { seedWalletCategories } from "@/src/lib/finance/seed-categories";

export async function getMonthOverviewAction(yearMonth?: string) {
  const { walletId } = await requireActiveWallet();
  const now = new Date();
  const ym =
    yearMonth ??
    formatYearMonth(now.getFullYear(), now.getMonth() + 1);

  return getMonthOverview(walletId, ym);
}

export async function listCategories() {
  const { walletId } = await requireActiveWallet();

  let rows = await db.query.categories.findMany({
    where: eq(categories.walletId, walletId),
    orderBy: (table, { asc }) => [asc(table.type), asc(table.name)],
  });

  if (rows.length === 0) {
    await seedWalletCategories(walletId);
    rows = await db.query.categories.findMany({
      where: eq(categories.walletId, walletId),
      orderBy: (table, { asc }) => [asc(table.type), asc(table.name)],
    });
  }

  return rows;
}

export async function listRecurrents(filters?: {
  type?: "income" | "expense";
  kind?: "subscription" | "recurring_expense" | "fixed_income";
}) {
  const { walletId } = await requireActiveWallet();

  const conditions: SQL[] = [eq(recurrentTransactions.walletId, walletId)];

  if (filters?.type) {
    conditions.push(eq(recurrentTransactions.type, filters.type));
  }

  if (filters?.kind) {
    conditions.push(eq(recurrentTransactions.recurrenceKind, filters.kind));
  }

  return db.query.recurrentTransactions.findMany({
    where: and(...conditions),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    with: {
      category: true,
      creditCard: true,
    },
  });
}

export type RecurrentSummary = {
  id: string;
  description: string;
  amount: number;
  recurrenceKind: "subscription" | "recurring_expense" | "fixed_income";
  dayOfMonth: number;
  status: "active" | "inactive";
  paymentMethod: string;
  startDate: Date;
  endDate: Date | null;
  categoryId: string | null;
  categoryName: string | null;
  creditCardId: string | null;
  creditCardName: string | null;
  notes: string | null;
  thisMonthOccurrence: {
    id: string;
    status: "pending" | "paid" | "received" | "canceled";
    amount: number;
    transactionDate: Date;
  } | null;
};

export async function listRecurrentSummaries(filters: {
  kind: "subscription" | "recurring_expense" | "fixed_income";
}): Promise<RecurrentSummary[]> {
  const { walletId } = await requireActiveWallet();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const { start, end } = getMonthRange(year, month);

  await ensureRecurrentOccurrences(walletId, year, month);

  const rows = await db.query.recurrentTransactions.findMany({
    where: and(
      eq(recurrentTransactions.walletId, walletId),
      eq(recurrentTransactions.recurrenceKind, filters.kind),
    ),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    with: {
      category: true,
      creditCard: true,
      transactions: {
        where: and(
          gte(transactions.transactionDate, start),
          lte(transactions.transactionDate, end),
          ne(transactions.status, "canceled"),
        ),
        orderBy: (table, { desc }) => [desc(table.transactionDate)],
        limit: 1,
      },
    },
  });

  return rows.map((row) => {
    const occurrence = row.transactions[0] ?? null;
    return {
      id: row.id,
      description: row.description,
      amount: toNumber(row.amount),
      recurrenceKind: row.recurrenceKind,
      dayOfMonth: row.dayOfMonth,
      status: row.status,
      paymentMethod: row.paymentMethod,
      startDate: row.startDate,
      endDate: row.endDate,
      categoryId: row.categoryId,
      categoryName: row.category?.name ?? null,
      creditCardId: row.creditCardId,
      creditCardName: row.creditCard?.name ?? null,
      notes: row.notes,
      thisMonthOccurrence: occurrence
        ? {
            id: occurrence.id,
            status: occurrence.status,
            amount: toNumber(occurrence.amount),
            transactionDate: occurrence.transactionDate,
          }
        : null,
    };
  });
}

export type TransactionFilters = {
  q?: string;
  from?: string;
  to?: string;
  card?: string;
  category?: string;
  payment?: string;
  type?: "income" | "expense";
};

export async function listTransactions(filters: TransactionFilters = {}) {
  const { walletId } = await requireActiveWallet();

  const conditions: SQL[] = [
    eq(transactions.walletId, walletId),
    ne(transactions.status, "canceled"),
  ];

  if (filters.type) {
    conditions.push(eq(transactions.type, filters.type));
  }

  if (filters.q?.trim()) {
    conditions.push(ilike(transactions.description, `%${filters.q.trim()}%`));
  }

  if (filters.from) {
    const fromDate = parseDateOnly(filters.from);
    fromDate.setHours(0, 0, 0, 0);
    conditions.push(gte(transactions.transactionDate, fromDate));
  }

  if (filters.to) {
    const toDate = parseDateOnly(filters.to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(transactions.transactionDate, toDate));
  }

  if (filters.card) {
    conditions.push(eq(transactions.creditCardId, filters.card));
  }

  if (filters.category) {
    conditions.push(eq(transactions.categoryId, filters.category));
  }

  if (filters.payment) {
    conditions.push(
      eq(
        transactions.paymentMethod,
        filters.payment as
          | "credit_card"
          | "debit_card"
          | "pix"
          | "bank_transfer"
          | "cash",
      ),
    );
  }

  return db
    .select({
      id: transactions.id,
      description: transactions.description,
      amount: transactions.amount,
      type: transactions.type,
      status: transactions.status,
      paymentMethod: transactions.paymentMethod,
      transactionDate: transactions.transactionDate,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      creditCardId: transactions.creditCardId,
      creditCardName: creditCards.name,
      installmentNumber: transactions.installmentNumber,
      installmentPlanId: transactions.installmentPlanId,
      recurrentTransactionId: transactions.recurrentTransactionId,
      notes: transactions.notes,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(creditCards, eq(transactions.creditCardId, creditCards.id))
    .where(and(...conditions))
    .orderBy(desc(transactions.transactionDate));
}

export async function resolveMonthParam(searchParams: {
  month?: string;
}): Promise<string> {
  await requireSession();

  const now = new Date();
  const fallback = formatYearMonth(now.getFullYear(), now.getMonth() + 1);
  if (!searchParams.month) return fallback;
  const { year, month } = parseYearMonth(searchParams.month);
  return formatYearMonth(year, month);
}

export type InstallmentPlanSummary = {
  id: string;
  description: string;
  totalAmount: number;
  installmentAmount: number;
  totalInstallments: number;
  paidInstallments: number;
  remainingInstallments: number;
  paidAmount: number;
  remainingAmount: number;
  progressPercent: number;
  status: "active" | "completed" | "canceled";
  paymentMethod: string;
  firstDueDate: Date;
  lastDueDate: Date;
  nextDueDate: Date | null;
  categoryName: string | null;
  creditCardName: string | null;
  notes: string | null;
  installments: {
    id: string;
    number: number;
    amount: number;
    status: "pending" | "paid" | "received" | "canceled";
    dueDate: Date;
  }[];
};

export async function listInstallmentPlans(): Promise<InstallmentPlanSummary[]> {
  const { walletId } = await requireActiveWallet();

  const plans = await db.query.installmentPlans.findMany({
    where: and(
      eq(installmentPlans.walletId, walletId),
      ne(installmentPlans.status, "canceled"),
    ),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    with: {
      category: true,
      creditCard: true,
      transactions: {
        orderBy: (table, { asc }) => [asc(table.installmentNumber)],
      },
    },
  });

  return plans.map((plan) => {
    const totalAmount = toNumber(plan.totalAmount);
    const installmentAmount = toNumber(plan.installmentAmount);
    const installments = plan.transactions
      .filter((tx) => tx.status !== "canceled")
      .map((tx) => ({
        id: tx.id,
        number: tx.installmentNumber ?? 0,
        amount: toNumber(tx.amount),
        status: tx.status,
        dueDate: tx.transactionDate,
      }))
      .sort((a, b) => a.number - b.number);

    const paidInstallments = installments.filter(
      (i) => i.status === "paid" || i.status === "received",
    ).length;
    const totalInstallments =
      installments.length > 0 ? installments.length : plan.totalInstallments;
    const remainingInstallments = Math.max(
      totalInstallments - paidInstallments,
      0,
    );
    const paidAmount = installments
      .filter((i) => i.status === "paid" || i.status === "received")
      .reduce((sum, i) => sum + i.amount, 0);
    const remainingAmount = Math.max(totalAmount - paidAmount, 0);
    const progressPercent =
      totalInstallments > 0
        ? Math.round((paidInstallments / totalInstallments) * 100)
        : 0;

    const pending = installments
      .filter((i) => i.status === "pending")
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    const nextDueDate = pending[0]?.dueDate ?? null;
    const lastDueDate =
      installments[installments.length - 1]?.dueDate ?? plan.firstDueDate;

    return {
      id: plan.id,
      description: plan.description,
      totalAmount,
      installmentAmount,
      totalInstallments,
      paidInstallments,
      remainingInstallments,
      paidAmount,
      remainingAmount,
      progressPercent,
      status: plan.status,
      paymentMethod: plan.paymentMethod,
      firstDueDate: plan.firstDueDate,
      lastDueDate,
      nextDueDate,
      categoryName: plan.category?.name ?? null,
      creditCardName: plan.creditCard?.name ?? null,
      notes: plan.notes,
      installments,
    };
  });
}
