import "server-only";

import { and, eq, gte, lte, ne } from "drizzle-orm";

import { db } from "@/src/db";
import {
  categories,
  creditCards,
  expenses,
  fixedIncomes,
  incomes,
  installments,
  recurringExpenseCharges,
  recurringExpenses,
  subscriptionCharges,
  subscriptions,
} from "@/src/db/schema";
import {
  clampDayOfMonth,
  getMonthRange,
  parseYearMonth,
  roundMoney,
  toNumber,
} from "@/src/lib/finance/dates";

export type LedgerSource =
  | "income"
  | "expense"
  | "subscription"
  | "recurring"
  | "installment";

export type MonthTransaction = {
  id: string;
  source: LedgerSource;
  description: string;
  amount: number;
  type: "income" | "expense";
  status: "pending" | "paid" | "received" | "canceled";
  paymentMethod: string;
  transactionDate: Date;
  categoryId: string | null;
  categoryName: string | null;
  creditCardId: string | null;
  creditCardName: string | null;
  installmentPlanId: string | null;
  installmentNumber: number | null;
  group: "income" | "subscription" | "recurring" | "installment" | "one_off";
};

export type MonthOverview = {
  year: number;
  month: number;
  plannedIncome: number;
  plannedExpense: number;
  plannedBalance: number;
  realizedIncome: number;
  realizedExpense: number;
  realizedBalance: number;
  byCategory: { id: string | null; name: string; amount: number }[];
  byCard: { id: string | null; name: string; amount: number }[];
  byPaymentMethod: { method: string; amount: number }[];
  byDay: { day: number; amount: number; count: number }[];
  byWeekday: { weekday: number; label: string; amount: number }[];
  peakDays: { day: number; amount: number; count: number }[];
  pendingCount: number;
  paidCount: number;
  avgDailyExpense: number;
  groups: {
    income: MonthTransaction[];
    subscription: MonthTransaction[];
    recurring: MonthTransaction[];
    installment: MonthTransaction[];
    one_off: MonthTransaction[];
  };
  transactions: MonthTransaction[];
};

const WEEKDAY_LABELS = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sáb",
] as const;

type PlanWindow = {
  id: string;
  walletId: string;
  description: string;
  amount: string;
  dayOfMonth: number;
  startDate: Date;
  endDate: Date | null;
  paymentMethod:
    | "credit_card"
    | "debit_card"
    | "pix"
    | "bank_transfer"
    | "cash";
  categoryId: string | null;
  creditCardId?: string | null;
  createdByUserId: string | null;
  notes: string | null;
  status: "active" | "inactive";
};

function isActiveInMonth(
  startDate: Date,
  endDate: Date | null,
  monthStart: Date,
  monthEnd: Date,
) {
  if (startDate > monthEnd) return false;
  if (endDate && endDate < monthStart) return false;
  return true;
}

function isRealized(status: MonthTransaction["status"]) {
  return status === "paid" || status === "received";
}

function isPlanned(status: MonthTransaction["status"]) {
  return status === "pending" || status === "paid" || status === "received";
}

function occurrenceDate(plan: PlanWindow, year: number, month: number) {
  const date = clampDayOfMonth(year, month, plan.dayOfMonth);
  if (date < plan.startDate) return null;
  if (plan.endDate && date > plan.endDate) return null;
  return date;
}

export async function ensureDomainOccurrences(
  walletId: string,
  year: number,
  month: number,
) {
  const { start, end } = getMonthRange(year, month);

  const [fixed, subs, recurring] = await Promise.all([
    db.query.fixedIncomes.findMany({
      where: and(
        eq(fixedIncomes.walletId, walletId),
        eq(fixedIncomes.status, "active"),
      ),
    }),
    db.query.subscriptions.findMany({
      where: and(
        eq(subscriptions.walletId, walletId),
        eq(subscriptions.status, "active"),
      ),
    }),
    db.query.recurringExpenses.findMany({
      where: and(
        eq(recurringExpenses.walletId, walletId),
        eq(recurringExpenses.status, "active"),
      ),
    }),
  ]);

  for (const plan of fixed) {
    if (!isActiveInMonth(plan.startDate, plan.endDate, start, end)) continue;
    const date = occurrenceDate(plan, year, month);
    if (!date) continue;

    const existing = await db.query.incomes.findFirst({
      where: and(
        eq(incomes.walletId, walletId),
        eq(incomes.fixedIncomeId, plan.id),
        gte(incomes.transactionDate, start),
        lte(incomes.transactionDate, end),
        ne(incomes.status, "canceled"),
      ),
    });
    if (existing) continue;

    await db.insert(incomes).values({
      walletId,
      description: plan.description,
      amount: plan.amount,
      status: "pending",
      paymentMethod: plan.paymentMethod,
      categoryId: plan.categoryId,
      fixedIncomeId: plan.id,
      transactionDate: date,
      createdByUserId: plan.createdByUserId,
      notes: plan.notes,
    });
  }

  for (const plan of subs) {
    if (!isActiveInMonth(plan.startDate, plan.endDate, start, end)) continue;
    const date = occurrenceDate(plan, year, month);
    if (!date) continue;

    const existing = await db.query.subscriptionCharges.findFirst({
      where: and(
        eq(subscriptionCharges.walletId, walletId),
        eq(subscriptionCharges.subscriptionId, plan.id),
        gte(subscriptionCharges.dueDate, start),
        lte(subscriptionCharges.dueDate, end),
        ne(subscriptionCharges.status, "canceled"),
      ),
    });
    if (existing) continue;

    await db.insert(subscriptionCharges).values({
      walletId,
      subscriptionId: plan.id,
      description: plan.description,
      amount: plan.amount,
      status: "pending",
      paymentMethod: plan.paymentMethod,
      categoryId: plan.categoryId,
      creditCardId: plan.creditCardId,
      dueDate: date,
      createdByUserId: plan.createdByUserId,
      notes: plan.notes,
    });
  }

  for (const plan of recurring) {
    if (!isActiveInMonth(plan.startDate, plan.endDate, start, end)) continue;
    const date = occurrenceDate(plan, year, month);
    if (!date) continue;

    const existing = await db.query.recurringExpenseCharges.findFirst({
      where: and(
        eq(recurringExpenseCharges.walletId, walletId),
        eq(recurringExpenseCharges.recurringExpenseId, plan.id),
        gte(recurringExpenseCharges.dueDate, start),
        lte(recurringExpenseCharges.dueDate, end),
        ne(recurringExpenseCharges.status, "canceled"),
      ),
    });
    if (existing) continue;

    await db.insert(recurringExpenseCharges).values({
      walletId,
      recurringExpenseId: plan.id,
      description: plan.description,
      amount: plan.amount,
      status: "pending",
      paymentMethod: plan.paymentMethod,
      categoryId: plan.categoryId,
      creditCardId: plan.creditCardId,
      dueDate: date,
      createdByUserId: plan.createdByUserId,
      notes: plan.notes,
    });
  }
}

export async function getMonthOverview(
  walletId: string,
  yearMonth: string,
): Promise<MonthOverview> {
  const { year, month } = parseYearMonth(yearMonth);
  const { start, end } = getMonthRange(year, month);

  await ensureDomainOccurrences(walletId, year, month);

  const [incomeRows, expenseRows, subscriptionRows, recurringRows, installmentRows] =
    await Promise.all([
      db
        .select({
          id: incomes.id,
          description: incomes.description,
          amount: incomes.amount,
          status: incomes.status,
          paymentMethod: incomes.paymentMethod,
          transactionDate: incomes.transactionDate,
          categoryId: incomes.categoryId,
          categoryName: categories.name,
        })
        .from(incomes)
        .leftJoin(categories, eq(incomes.categoryId, categories.id))
        .where(
          and(
            eq(incomes.walletId, walletId),
            gte(incomes.transactionDate, start),
            lte(incomes.transactionDate, end),
            ne(incomes.status, "canceled"),
          ),
        ),
      db
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
        })
        .from(expenses)
        .leftJoin(categories, eq(expenses.categoryId, categories.id))
        .leftJoin(creditCards, eq(expenses.creditCardId, creditCards.id))
        .where(
          and(
            eq(expenses.walletId, walletId),
            gte(expenses.transactionDate, start),
            lte(expenses.transactionDate, end),
            ne(expenses.status, "canceled"),
          ),
        ),
      db
        .select({
          id: subscriptionCharges.id,
          description: subscriptionCharges.description,
          amount: subscriptionCharges.amount,
          status: subscriptionCharges.status,
          paymentMethod: subscriptionCharges.paymentMethod,
          dueDate: subscriptionCharges.dueDate,
          categoryId: subscriptionCharges.categoryId,
          categoryName: categories.name,
          creditCardId: subscriptionCharges.creditCardId,
          creditCardName: creditCards.name,
        })
        .from(subscriptionCharges)
        .leftJoin(categories, eq(subscriptionCharges.categoryId, categories.id))
        .leftJoin(
          creditCards,
          eq(subscriptionCharges.creditCardId, creditCards.id),
        )
        .where(
          and(
            eq(subscriptionCharges.walletId, walletId),
            gte(subscriptionCharges.dueDate, start),
            lte(subscriptionCharges.dueDate, end),
            ne(subscriptionCharges.status, "canceled"),
          ),
        ),
      db
        .select({
          id: recurringExpenseCharges.id,
          description: recurringExpenseCharges.description,
          amount: recurringExpenseCharges.amount,
          status: recurringExpenseCharges.status,
          paymentMethod: recurringExpenseCharges.paymentMethod,
          dueDate: recurringExpenseCharges.dueDate,
          categoryId: recurringExpenseCharges.categoryId,
          categoryName: categories.name,
          creditCardId: recurringExpenseCharges.creditCardId,
          creditCardName: creditCards.name,
        })
        .from(recurringExpenseCharges)
        .leftJoin(
          categories,
          eq(recurringExpenseCharges.categoryId, categories.id),
        )
        .leftJoin(
          creditCards,
          eq(recurringExpenseCharges.creditCardId, creditCards.id),
        )
        .where(
          and(
            eq(recurringExpenseCharges.walletId, walletId),
            gte(recurringExpenseCharges.dueDate, start),
            lte(recurringExpenseCharges.dueDate, end),
            ne(recurringExpenseCharges.status, "canceled"),
          ),
        ),
      db
        .select({
          id: installments.id,
          description: installments.description,
          amount: installments.amount,
          status: installments.status,
          paymentMethod: installments.paymentMethod,
          dueDate: installments.dueDate,
          categoryId: installments.categoryId,
          categoryName: categories.name,
          creditCardId: installments.creditCardId,
          creditCardName: creditCards.name,
          installmentPlanId: installments.installmentPlanId,
          installmentNumber: installments.installmentNumber,
        })
        .from(installments)
        .leftJoin(categories, eq(installments.categoryId, categories.id))
        .leftJoin(creditCards, eq(installments.creditCardId, creditCards.id))
        .where(
          and(
            eq(installments.walletId, walletId),
            gte(installments.dueDate, start),
            lte(installments.dueDate, end),
            ne(installments.status, "canceled"),
          ),
        ),
    ]);

  const mapped: MonthTransaction[] = [
    ...incomeRows.map((row) => ({
      id: row.id,
      source: "income" as const,
      description: row.description,
      amount: toNumber(row.amount),
      type: "income" as const,
      status: row.status,
      paymentMethod: row.paymentMethod,
      transactionDate: row.transactionDate,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      creditCardId: null,
      creditCardName: null,
      installmentPlanId: null,
      installmentNumber: null,
      group: "income" as const,
    })),
    ...expenseRows.map((row) => ({
      id: row.id,
      source: "expense" as const,
      description: row.description,
      amount: toNumber(row.amount),
      type: "expense" as const,
      status: row.status,
      paymentMethod: row.paymentMethod,
      transactionDate: row.transactionDate,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      creditCardId: row.creditCardId,
      creditCardName: row.creditCardName,
      installmentPlanId: null,
      installmentNumber: null,
      group: "one_off" as const,
    })),
    ...subscriptionRows.map((row) => ({
      id: row.id,
      source: "subscription" as const,
      description: row.description,
      amount: toNumber(row.amount),
      type: "expense" as const,
      status: row.status,
      paymentMethod: row.paymentMethod,
      transactionDate: row.dueDate,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      creditCardId: row.creditCardId,
      creditCardName: row.creditCardName,
      installmentPlanId: null,
      installmentNumber: null,
      group: "subscription" as const,
    })),
    ...recurringRows.map((row) => ({
      id: row.id,
      source: "recurring" as const,
      description: row.description,
      amount: toNumber(row.amount),
      type: "expense" as const,
      status: row.status,
      paymentMethod: row.paymentMethod,
      transactionDate: row.dueDate,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      creditCardId: row.creditCardId,
      creditCardName: row.creditCardName,
      installmentPlanId: null,
      installmentNumber: null,
      group: "recurring" as const,
    })),
    ...installmentRows.map((row) => ({
      id: row.id,
      source: "installment" as const,
      description: row.description,
      amount: toNumber(row.amount),
      type: "expense" as const,
      status: row.status,
      paymentMethod: row.paymentMethod,
      transactionDate: row.dueDate,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      creditCardId: row.creditCardId,
      creditCardName: row.creditCardName,
      installmentPlanId: row.installmentPlanId,
      installmentNumber: row.installmentNumber,
      group: "installment" as const,
    })),
  ].sort((a, b) => a.transactionDate.getTime() - b.transactionDate.getTime());

  let plannedIncome = 0;
  let plannedExpense = 0;
  let realizedIncome = 0;
  let realizedExpense = 0;
  let pendingCount = 0;
  let paidCount = 0;

  const categoryMap = new Map<
    string,
    { id: string | null; name: string; amount: number }
  >();
  const cardMap = new Map<
    string,
    { id: string | null; name: string; amount: number }
  >();
  const paymentMap = new Map<string, number>();
  const dayMap = new Map<number, { day: number; amount: number; count: number }>();
  const weekdayMap = new Map<number, number>();

  const groups: MonthOverview["groups"] = {
    income: [],
    subscription: [],
    recurring: [],
    installment: [],
    one_off: [],
  };

  for (const tx of mapped) {
    groups[tx.group].push(tx);

    if (tx.status === "pending") pendingCount += 1;
    if (isRealized(tx.status)) paidCount += 1;

    if (tx.type === "income") {
      if (isPlanned(tx.status)) plannedIncome += tx.amount;
      if (isRealized(tx.status)) realizedIncome += tx.amount;
      continue;
    }

    if (isPlanned(tx.status)) plannedExpense += tx.amount;
    if (isRealized(tx.status)) realizedExpense += tx.amount;

    if (!isPlanned(tx.status)) continue;

    const catKey = tx.categoryId ?? "none";
    const cat = categoryMap.get(catKey) ?? {
      id: tx.categoryId,
      name: tx.categoryName ?? "Sem categoria",
      amount: 0,
    };
    cat.amount += tx.amount;
    categoryMap.set(catKey, cat);

    if (tx.creditCardId) {
      const card = cardMap.get(tx.creditCardId) ?? {
        id: tx.creditCardId,
        name: tx.creditCardName ?? "Cartão",
        amount: 0,
      };
      card.amount += tx.amount;
      cardMap.set(tx.creditCardId, card);
    }

    paymentMap.set(
      tx.paymentMethod,
      (paymentMap.get(tx.paymentMethod) ?? 0) + tx.amount,
    );

    if (tx.group === "one_off") {
      const day = tx.transactionDate.getUTCDate();
      const dayEntry = dayMap.get(day) ?? { day, amount: 0, count: 0 };
      dayEntry.amount += tx.amount;
      dayEntry.count += 1;
      dayMap.set(day, dayEntry);

      const weekday = tx.transactionDate.getUTCDay();
      weekdayMap.set(weekday, (weekdayMap.get(weekday) ?? 0) + tx.amount);
    }
  }

  const byDay = [...dayMap.values()]
    .map((day) => ({ ...day, amount: roundMoney(day.amount) }))
    .sort((a, b) => a.day - b.day);

  const peakDays = [...byDay].sort((a, b) => b.amount - a.amount).slice(0, 5);
  const daysInMonth = end.getUTCDate();

  return {
    year,
    month,
    plannedIncome: roundMoney(plannedIncome),
    plannedExpense: roundMoney(plannedExpense),
    plannedBalance: roundMoney(plannedIncome - plannedExpense),
    realizedIncome: roundMoney(realizedIncome),
    realizedExpense: roundMoney(realizedExpense),
    realizedBalance: roundMoney(realizedIncome - realizedExpense),
    byCategory: [...categoryMap.values()]
      .map((item) => ({ ...item, amount: roundMoney(item.amount) }))
      .sort((a, b) => b.amount - a.amount),
    byCard: [...cardMap.values()]
      .map((item) => ({ ...item, amount: roundMoney(item.amount) }))
      .sort((a, b) => b.amount - a.amount),
    byPaymentMethod: [...paymentMap.entries()]
      .map(([method, amount]) => ({ method, amount: roundMoney(amount) }))
      .sort((a, b) => b.amount - a.amount),
    byDay,
    byWeekday: WEEKDAY_LABELS.map((label, weekday) => ({
      weekday,
      label,
      amount: roundMoney(weekdayMap.get(weekday) ?? 0),
    })),
    peakDays,
    pendingCount,
    paidCount,
    avgDailyExpense: roundMoney(plannedExpense / Math.max(daysInMonth, 1)),
    groups,
    transactions: mapped,
  };
}
