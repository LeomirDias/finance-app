import "server-only";

import { and, eq, gte, lte, ne } from "drizzle-orm";

import { db } from "@/src/db";
import {
  categories,
  creditCards,
  recurrentTransactions,
  transactions,
} from "@/src/db/schema";
import {
  clampDayOfMonth,
  getMonthRange,
  parseYearMonth,
  roundMoney,
  toNumber,
} from "@/src/lib/finance/dates";

export type MonthTransaction = {
  id: string;
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
  recurrentTransactionId: string | null;
  installmentPlanId: string | null;
  installmentNumber: number | null;
  recurrenceKind: "subscription" | "recurring_expense" | "fixed_income" | null;
  group:
    | "income"
    | "subscription"
    | "recurring"
    | "installment"
    | "one_off";
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

function isActiveInMonth(
  startDate: Date,
  endDate: Date | null,
  monthStart: Date,
  monthEnd: Date,
): boolean {
  if (startDate > monthEnd) return false;
  if (endDate && endDate < monthStart) return false;
  return true;
}

function isRealized(status: MonthTransaction["status"]): boolean {
  return status === "paid" || status === "received";
}

function isPlanned(status: MonthTransaction["status"]): boolean {
  return status === "pending" || status === "paid" || status === "received";
}

function resolveGroup(
  tx: {
    type: "income" | "expense";
    installmentPlanId: string | null;
    recurrentTransactionId: string | null;
    recurrenceKind: "subscription" | "recurring_expense" | "fixed_income" | null;
  },
): MonthTransaction["group"] {
  if (tx.installmentPlanId) return "installment";
  if (tx.recurrenceKind === "subscription") return "subscription";
  if (tx.recurrenceKind === "recurring_expense") return "recurring";
  if (tx.recurrenceKind === "fixed_income" || tx.type === "income") {
    return "income";
  }
  return "one_off";
}

export async function ensureRecurrentOccurrences(
  walletId: string,
  year: number,
  month: number,
) {
  const { start, end } = getMonthRange(year, month);

  const recurrents = await db.query.recurrentTransactions.findMany({
    where: and(
      eq(recurrentTransactions.walletId, walletId),
      eq(recurrentTransactions.status, "active"),
    ),
  });

  for (const recurrent of recurrents) {
    if (!isActiveInMonth(recurrent.startDate, recurrent.endDate, start, end)) {
      continue;
    }

    const occurrenceDate = clampDayOfMonth(year, month, recurrent.dayOfMonth);

    if (occurrenceDate < recurrent.startDate) continue;
    if (recurrent.endDate && occurrenceDate > recurrent.endDate) continue;

    const existing = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.walletId, walletId),
        eq(transactions.recurrentTransactionId, recurrent.id),
        gte(transactions.transactionDate, start),
        lte(transactions.transactionDate, end),
        ne(transactions.status, "canceled"),
      ),
    });

    if (existing) continue;

    const defaultStatus =
      recurrent.type === "income" ? ("pending" as const) : ("pending" as const);

    await db.insert(transactions).values({
      walletId,
      description: recurrent.description,
      amount: recurrent.amount,
      type: recurrent.type,
      status: defaultStatus,
      paymentMethod: recurrent.paymentMethod,
      categoryId: recurrent.categoryId,
      creditCardId: recurrent.creditCardId,
      recurrentTransactionId: recurrent.id,
      transactionDate: occurrenceDate,
      createdByUserId: recurrent.createdByUserId,
      notes: recurrent.notes,
    });
  }
}

export async function getMonthOverview(
  walletId: string,
  yearMonth: string,
): Promise<MonthOverview> {
  const { year, month } = parseYearMonth(yearMonth);
  const { start, end } = getMonthRange(year, month);

  await ensureRecurrentOccurrences(walletId, year, month);

  const rows = await db
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
      recurrentTransactionId: transactions.recurrentTransactionId,
      installmentPlanId: transactions.installmentPlanId,
      installmentNumber: transactions.installmentNumber,
      recurrenceKind: recurrentTransactions.recurrenceKind,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(creditCards, eq(transactions.creditCardId, creditCards.id))
    .leftJoin(
      recurrentTransactions,
      eq(transactions.recurrentTransactionId, recurrentTransactions.id),
    )
    .where(
      and(
        eq(transactions.walletId, walletId),
        gte(transactions.transactionDate, start),
        lte(transactions.transactionDate, end),
        ne(transactions.status, "canceled"),
      ),
    )
    .orderBy(transactions.transactionDate);

  const mapped: MonthTransaction[] = rows.map((row) => {
    const base = {
      id: row.id,
      description: row.description,
      amount: toNumber(row.amount),
      type: row.type,
      status: row.status,
      paymentMethod: row.paymentMethod,
      transactionDate: row.transactionDate,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      creditCardId: row.creditCardId,
      creditCardName: row.creditCardName,
      recurrentTransactionId: row.recurrentTransactionId,
      installmentPlanId: row.installmentPlanId,
      installmentNumber: row.installmentNumber,
      recurrenceKind: row.recurrenceKind,
    };

    return {
      ...base,
      group: resolveGroup(base),
    };
  });

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
    } else {
      if (isPlanned(tx.status)) plannedExpense += tx.amount;
      if (isRealized(tx.status)) realizedExpense += tx.amount;

      if (isPlanned(tx.status)) {
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

        // Gráficos por dia: apenas gastos avulsos (sem parcelas/recorrências/assinaturas)
        if (tx.group === "one_off") {
          const day = tx.transactionDate.getDate();
          const dayEntry = dayMap.get(day) ?? { day, amount: 0, count: 0 };
          dayEntry.amount += tx.amount;
          dayEntry.count += 1;
          dayMap.set(day, dayEntry);

          const weekday = tx.transactionDate.getDay();
          weekdayMap.set(weekday, (weekdayMap.get(weekday) ?? 0) + tx.amount);
        }
      }
    }
  }

  const byDay = [...dayMap.values()]
    .map((d) => ({
      ...d,
      amount: roundMoney(d.amount),
    }))
    .sort((a, b) => a.day - b.day);

  const peakDays = [...byDay]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const daysInMonth = end.getDate();
  const avgDailyExpense = roundMoney(
    plannedExpense / Math.max(daysInMonth, 1),
  );

  const byWeekday = WEEKDAY_LABELS.map((label, weekday) => ({
    weekday,
    label,
    amount: roundMoney(weekdayMap.get(weekday) ?? 0),
  }));

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
      .map((c) => ({ ...c, amount: roundMoney(c.amount) }))
      .sort((a, b) => b.amount - a.amount),
    byCard: [...cardMap.values()]
      .map((c) => ({ ...c, amount: roundMoney(c.amount) }))
      .sort((a, b) => b.amount - a.amount),
    byPaymentMethod: [...paymentMap.entries()]
      .map(([method, amount]) => ({ method, amount: roundMoney(amount) }))
      .sort((a, b) => b.amount - a.amount),
    byDay,
    byWeekday,
    peakDays,
    pendingCount,
    paidCount,
    avgDailyExpense,
    groups,
    transactions: mapped,
  };
}
