"use server";

import {
  and,
  desc,
  eq,
  gte,
  ilike,
  lte,
  ne,
  type AnyColumn,
  type SQL,
} from "drizzle-orm";

import { db } from "@/src/db";
import {
  categories,
  creditCards,
  expenses,
  fixedIncomes,
  incomes,
  installmentPlans,
  recurringExpenseCharges,
  recurringExpenses,
  subscriptionCharges,
  subscriptions,
} from "@/src/db/schema";
import { requireActiveWallet } from "@/src/lib/require-active-wallet";
import { requireSession } from "@/src/lib/require-session";
import {
  ensureDomainOccurrences,
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
    yearMonth ?? formatYearMonth(now.getFullYear(), now.getMonth() + 1);

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

export type PlanSummary = {
  id: string;
  description: string;
  amount: number;
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

type PlanKind = "subscription" | "recurring_expense" | "fixed_income";

export async function listPlanSummaries(kind: PlanKind): Promise<PlanSummary[]> {
  const { walletId } = await requireActiveWallet();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  await ensureDomainOccurrences(walletId, year, month);

  if (kind === "fixed_income") {
    const rows = await db.query.fixedIncomes.findMany({
      where: eq(fixedIncomes.walletId, walletId),
      orderBy: (table, { desc: orderDesc }) => [orderDesc(table.createdAt)],
      with: {
        category: true,
        incomes: {
          where: and(
            gte(incomes.transactionDate, getMonthRange(year, month).start),
            lte(incomes.transactionDate, getMonthRange(year, month).end),
            ne(incomes.status, "canceled"),
          ),
          orderBy: (table, { desc: orderDesc }) => [
            orderDesc(table.transactionDate),
          ],
          limit: 1,
        },
      },
    });

    return rows.map((row) => {
      const occurrence = row.incomes[0] ?? null;
      return {
        id: row.id,
        description: row.description,
        amount: toNumber(row.amount),
        dayOfMonth: row.dayOfMonth,
        status: row.status,
        paymentMethod: row.paymentMethod,
        startDate: row.startDate,
        endDate: row.endDate,
        categoryId: row.categoryId,
        categoryName: row.category?.name ?? null,
        creditCardId: null,
        creditCardName: null,
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

  if (kind === "subscription") {
    const { start, end } = getMonthRange(year, month);
    const rows = await db.query.subscriptions.findMany({
      where: eq(subscriptions.walletId, walletId),
      orderBy: (table, { desc: orderDesc }) => [orderDesc(table.createdAt)],
      with: {
        category: true,
        creditCard: true,
        charges: {
          where: and(
            gte(subscriptionCharges.dueDate, start),
            lte(subscriptionCharges.dueDate, end),
            ne(subscriptionCharges.status, "canceled"),
          ),
          orderBy: (table, { desc: orderDesc }) => [orderDesc(table.dueDate)],
          limit: 1,
        },
      },
    });

    return rows.map((row) => {
      const occurrence = row.charges[0] ?? null;
      return {
        id: row.id,
        description: row.description,
        amount: toNumber(row.amount),
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
              transactionDate: occurrence.dueDate,
            }
          : null,
      };
    });
  }

  const { start, end } = getMonthRange(year, month);
  const rows = await db.query.recurringExpenses.findMany({
    where: eq(recurringExpenses.walletId, walletId),
    orderBy: (table, { desc: orderDesc }) => [orderDesc(table.createdAt)],
    with: {
      category: true,
      creditCard: true,
      charges: {
        where: and(
          gte(recurringExpenseCharges.dueDate, start),
          lte(recurringExpenseCharges.dueDate, end),
          ne(recurringExpenseCharges.status, "canceled"),
        ),
        orderBy: (table, { desc: orderDesc }) => [orderDesc(table.dueDate)],
        limit: 1,
      },
    },
  });

  return rows.map((row) => {
    const occurrence = row.charges[0] ?? null;
    return {
      id: row.id,
      description: row.description,
      amount: toNumber(row.amount),
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
            transactionDate: occurrence.dueDate,
          }
        : null,
    };
  });
}

export type LedgerFilters = {
  q?: string;
  from?: string;
  to?: string;
  card?: string;
  category?: string;
  payment?: string;
};

function dateConditions(filters: LedgerFilters, dateColumn: AnyColumn) {
  const conditions: SQL[] = [];

  if (filters.from) {
    const fromDate = parseDateOnly(filters.from);
    fromDate.setHours(0, 0, 0, 0);
    conditions.push(gte(dateColumn, fromDate));
  }

  if (filters.to) {
    const toDate = parseDateOnly(filters.to);
    toDate.setHours(23, 59, 59, 999);
    conditions.push(lte(dateColumn, toDate));
  }

  return conditions;
}

export async function listIncomes(filters: LedgerFilters = {}) {
  const { walletId } = await requireActiveWallet();
  const conditions: SQL[] = [
    eq(incomes.walletId, walletId),
    ne(incomes.status, "canceled"),
    ...dateConditions(filters, incomes.transactionDate),
  ];

  if (filters.q?.trim()) {
    conditions.push(ilike(incomes.description, `%${filters.q.trim()}%`));
  }
  if (filters.category) {
    conditions.push(eq(incomes.categoryId, filters.category));
  }
  if (filters.payment) {
    conditions.push(
      eq(
        incomes.paymentMethod,
        filters.payment as typeof incomes.paymentMethod.enumValues[number],
      ),
    );
  }

  return db
    .select({
      id: incomes.id,
      description: incomes.description,
      amount: incomes.amount,
      status: incomes.status,
      paymentMethod: incomes.paymentMethod,
      transactionDate: incomes.transactionDate,
      categoryId: incomes.categoryId,
      categoryName: categories.name,
      fixedIncomeId: incomes.fixedIncomeId,
      notes: incomes.notes,
    })
    .from(incomes)
    .leftJoin(categories, eq(incomes.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(incomes.transactionDate));
}

export async function listExpenses(filters: LedgerFilters = {}) {
  const { walletId } = await requireActiveWallet();
  const conditions: SQL[] = [
    eq(expenses.walletId, walletId),
    ne(expenses.status, "canceled"),
    ...dateConditions(filters, expenses.transactionDate),
  ];

  if (filters.q?.trim()) {
    conditions.push(ilike(expenses.description, `%${filters.q.trim()}%`));
  }
  if (filters.category) {
    conditions.push(eq(expenses.categoryId, filters.category));
  }
  if (filters.card) {
    conditions.push(eq(expenses.creditCardId, filters.card));
  }
  if (filters.payment) {
    conditions.push(
      eq(
        expenses.paymentMethod,
        filters.payment as typeof expenses.paymentMethod.enumValues[number],
      ),
    );
  }

  return db
    .select({
      id: expenses.id,
      description: expenses.description,
      amount: expenses.amount,
      status: expenses.status,
      paymentMethod: expenses.paymentMethod,
      transactionDate: expenses.transactionDate,
      categoryId: expenses.categoryId,
      categoryName: categories.name,
      creditCardId: expenses.creditCardId,
      creditCardName: creditCards.name,
      purchasedAt: expenses.purchasedAt,
      notes: expenses.notes,
    })
    .from(expenses)
    .leftJoin(categories, eq(expenses.categoryId, categories.id))
    .leftJoin(creditCards, eq(expenses.creditCardId, creditCards.id))
    .where(and(...conditions))
    .orderBy(desc(expenses.transactionDate));
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
    orderBy: (table, { desc: orderDesc }) => [orderDesc(table.createdAt)],
    with: {
      category: true,
      creditCard: true,
      installments: {
        orderBy: (table, { asc }) => [asc(table.installmentNumber)],
      },
    },
  });

  return plans.map((plan) => {
    const totalAmount = toNumber(plan.totalAmount);
    const installmentAmount = toNumber(plan.installmentAmount);
    const items = plan.installments
      .filter((row) => row.status !== "canceled")
      .map((row) => ({
        id: row.id,
        number: row.installmentNumber,
        amount: toNumber(row.amount),
        status: row.status,
        dueDate: row.dueDate,
      }))
      .sort((a, b) => a.number - b.number);

    const paidInstallments = items.filter(
      (item) => item.status === "paid" || item.status === "received",
    ).length;
    const totalInstallments =
      items.length > 0 ? items.length : plan.totalInstallments;
    const remainingInstallments = Math.max(
      totalInstallments - paidInstallments,
      0,
    );
    const paidAmount = items
      .filter((item) => item.status === "paid" || item.status === "received")
      .reduce((sum, item) => sum + item.amount, 0);
    const remainingAmount = Math.max(totalAmount - paidAmount, 0);
    const progressPercent =
      totalInstallments > 0
        ? Math.round((paidInstallments / totalInstallments) * 100)
        : 0;

    const pending = items
      .filter((item) => item.status === "pending")
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    const nextDueDate = pending[0]?.dueDate ?? null;
    const lastDueDate = items[items.length - 1]?.dueDate ?? plan.firstDueDate;

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
      installments: items,
    };
  });
}
