"use server";

import { and, eq, gte, lte, ne, type AnyColumn, type SQL } from "drizzle-orm";

import { db } from "@/src/db";
import {
  categories,
  creditCards,
  expenses,
  installmentPlans,
  installments,
  recurringExpenseCharges,
  subscriptionCharges,
} from "@/src/db/schema";
import { ensureDomainOccurrences } from "@/src/lib/finance/month-summary";
import {
  businessCalendarParts,
  clampDayOfMonth,
  formatYearMonth,
  getMonthRange,
  parseYearMonth,
  roundMoney,
  toDateOnlyString,
  toNumber,
  todayDateInputValue,
} from "@/src/lib/finance/dates";
import { requireActiveWallet } from "@/src/lib/require-active-wallet";

export const STATEMENT_KINDS = [
  { id: "expense", param: "gasto", label: "Gastos", itemLabel: "Gasto" },
  {
    id: "subscription",
    param: "assinatura",
    label: "Assinaturas",
    itemLabel: "Assinatura",
  },
  {
    id: "recurring",
    param: "recorrente",
    label: "Recorrentes",
    itemLabel: "Recorrente",
  },
  { id: "installment", param: "compra", label: "Compras", itemLabel: "Compra" },
] as const;

export type CardStatementKind = (typeof STATEMENT_KINDS)[number]["id"];

export type CardStatementToggleSource =
  | "expense"
  | "subscription"
  | "recurring"
  | "installment";

export type CardStatementStatus = "pending" | "paid";

export type CardStatementItem = {
  id: string;
  entryId: string;
  source: CardStatementToggleSource;
  kind: CardStatementKind;
  description: string;
  amount: number;
  status: "pending" | "paid" | "received" | "canceled";
  occurredAt: Date;
  categoryId: string | null;
  categoryName: string | null;
  installmentNumber: number | null;
  totalInstallments: number | null;
  notes: string | null;
};

export type CardStatementPhase =
  | "open"
  | "due_today"
  | "overdue"
  | "paid"
  | "empty"
  | "all";

export type CardStatement = {
  card: {
    id: string;
    name: string;
    institution: string | null;
    dueDay: number | null;
    status: "active" | "inactive" | "blocked";
  };
  month: string;
  year: number;
  monthNumber: number;
  allTime: boolean;
  dueDate: Date | null;
  phase: CardStatementPhase;
  categories: { id: string; name: string }[];
  items: CardStatementItem[];
  invoice: {
    amount: number;
    pending: number;
    paid: number;
    count: number;
    byKind: Record<CardStatementKind, { amount: number; count: number }>;
  };
  visible: {
    amount: number;
    count: number;
  };
};

const KIND_BY_PARAM: Record<string, CardStatementKind> = {
  gasto: "expense",
  assinatura: "subscription",
  recorrente: "recurring",
  compra: "installment",
};

export function parseCardStatementFilters(params: {
  mes?: string;
  periodo?: string;
  q?: string;
  tipo?: string;
  situacao?: string;
  categoria?: string;
}) {
  const today = businessCalendarParts();
  const parsedMonth = params.mes ? parseYearMonth(params.mes) : null;
  const month = parsedMonth
    ? formatYearMonth(parsedMonth.year, parsedMonth.month)
    : formatYearMonth(today.year, today.month);

  const kind = params.tipo ? KIND_BY_PARAM[params.tipo] : undefined;
  const status =
    params.situacao === "pendente" || params.situacao === "pago"
      ? params.situacao
      : undefined;

  return {
    month,
    allTime: params.periodo === "tudo",
    q: params.q?.trim() || undefined,
    kind,
    status: status as CardStatementStatus | undefined,
    categoryId: params.categoria?.trim() || undefined,
  };
}

function emptyByKind(): CardStatement["invoice"]["byKind"] {
  return {
    expense: { amount: 0, count: 0 },
    subscription: { amount: 0, count: 0 },
    recurring: { amount: 0, count: 0 },
    installment: { amount: 0, count: 0 },
  };
}

function isSettled(status: CardStatementItem["status"]) {
  return status === "paid" || status === "received";
}

function summarize(items: CardStatementItem[]) {
  const byKind = emptyByKind();
  let amount = 0;
  let pending = 0;
  let paid = 0;

  for (const item of items) {
    amount += item.amount;
    byKind[item.kind].amount += item.amount;
    byKind[item.kind].count += 1;
    if (isSettled(item.status)) paid += item.amount;
    else if (item.status === "pending") pending += item.amount;
  }

  return {
    amount: roundMoney(amount),
    pending: roundMoney(pending),
    paid: roundMoney(paid),
    count: items.length,
    byKind: {
      expense: {
        amount: roundMoney(byKind.expense.amount),
        count: byKind.expense.count,
      },
      subscription: {
        amount: roundMoney(byKind.subscription.amount),
        count: byKind.subscription.count,
      },
      recurring: {
        amount: roundMoney(byKind.recurring.amount),
        count: byKind.recurring.count,
      },
      installment: {
        amount: roundMoney(byKind.installment.amount),
        count: byKind.installment.count,
      },
    },
  };
}

function invoicePhase(
  allTime: boolean,
  dueDate: Date | null,
  items: CardStatementItem[],
): CardStatementPhase {
  if (allTime) return "all";
  if (items.length === 0) return "empty";

  const hasPending = items.some((item) => item.status === "pending");
  if (!dueDate) return hasPending ? "open" : "paid";

  const today = todayDateInputValue();
  const due = toDateOnlyString(dueDate);
  if (due > today) return "open";
  if (due === today) return hasPending ? "due_today" : "paid";
  return hasPending ? "overdue" : "paid";
}

function matchesQuery(description: string, query: string) {
  return description
    .toLocaleLowerCase("pt-BR")
    .includes(query.toLocaleLowerCase("pt-BR"));
}

export async function getCreditCardStatement(
  cardId: string,
  filters: ReturnType<typeof parseCardStatementFilters>,
): Promise<CardStatement | null> {
  const { walletId } = await requireActiveWallet();

  const card = await db.query.creditCards.findFirst({
    where: and(eq(creditCards.id, cardId), eq(creditCards.walletId, walletId)),
  });

  if (!card) return null;

  const { year, month } = parseYearMonth(filters.month);
  const { start, end } = getMonthRange(year, month);

  if (filters.allTime) {
    const today = businessCalendarParts();
    await ensureDomainOccurrences(walletId, today.year, today.month);
  } else {
    await ensureDomainOccurrences(walletId, year, month);
  }

  const scope = {
    walletId,
    cardId,
    allTime: filters.allTime,
    start,
    end,
  };

  const [expenseRows, subscriptionRows, recurringRows, installmentRows] =
    await Promise.all([
      db
        .select({
          id: expenses.id,
          description: expenses.description,
          amount: expenses.amount,
          status: expenses.status,
          occurredAt: expenses.purchasedAt,
          categoryId: categories.id,
          categoryName: categories.name,
          notes: expenses.notes,
        })
        .from(expenses)
        .leftJoin(
          categories,
          and(
            eq(expenses.categoryId, categories.id),
            eq(categories.walletId, expenses.walletId),
          ),
        )
        .where(
          and(
            ...chargeConditions(scope, {
              walletId: expenses.walletId,
              creditCardId: expenses.creditCardId,
              status: expenses.status,
              date: expenses.transactionDate,
            }),
          ),
        ),
      db
        .select({
          id: subscriptionCharges.id,
          description: subscriptionCharges.description,
          amount: subscriptionCharges.amount,
          status: subscriptionCharges.status,
          occurredAt: subscriptionCharges.dueDate,
          categoryId: categories.id,
          categoryName: categories.name,
          notes: subscriptionCharges.notes,
        })
        .from(subscriptionCharges)
        .leftJoin(
          categories,
          and(
            eq(subscriptionCharges.categoryId, categories.id),
            eq(categories.walletId, subscriptionCharges.walletId),
          ),
        )
        .where(
          and(
            ...chargeConditions(scope, {
              walletId: subscriptionCharges.walletId,
              creditCardId: subscriptionCharges.creditCardId,
              status: subscriptionCharges.status,
              date: subscriptionCharges.dueDate,
            }),
          ),
        ),
      db
        .select({
          id: recurringExpenseCharges.id,
          description: recurringExpenseCharges.description,
          amount: recurringExpenseCharges.amount,
          status: recurringExpenseCharges.status,
          occurredAt: recurringExpenseCharges.dueDate,
          categoryId: categories.id,
          categoryName: categories.name,
          notes: recurringExpenseCharges.notes,
        })
        .from(recurringExpenseCharges)
        .leftJoin(
          categories,
          and(
            eq(recurringExpenseCharges.categoryId, categories.id),
            eq(categories.walletId, recurringExpenseCharges.walletId),
          ),
        )
        .where(
          and(
            ...chargeConditions(scope, {
              walletId: recurringExpenseCharges.walletId,
              creditCardId: recurringExpenseCharges.creditCardId,
              status: recurringExpenseCharges.status,
              date: recurringExpenseCharges.dueDate,
            }),
          ),
        ),
      db
        .select({
          id: installments.id,
          description: installments.description,
          amount: installments.amount,
          status: installments.status,
          occurredAt: installments.dueDate,
          categoryId: categories.id,
          categoryName: categories.name,
          notes: installments.notes,
          installmentNumber: installments.installmentNumber,
          totalInstallments: installmentPlans.totalInstallments,
        })
        .from(installments)
        .leftJoin(
          categories,
          and(
            eq(installments.categoryId, categories.id),
            eq(categories.walletId, installments.walletId),
          ),
        )
        .leftJoin(
          installmentPlans,
          and(
            eq(installments.installmentPlanId, installmentPlans.id),
            eq(installmentPlans.walletId, installments.walletId),
          ),
        )
        .where(
          and(
            ...chargeConditions(scope, {
              walletId: installments.walletId,
              creditCardId: installments.creditCardId,
              status: installments.status,
              date: installments.dueDate,
            }),
          ),
        ),
    ]);

  const allItems: CardStatementItem[] = [
    ...expenseRows.map((row) =>
      toItem("expense", row, {
        installmentNumber: null,
        totalInstallments: null,
      }),
    ),
    ...subscriptionRows.map((row) =>
      toItem("subscription", row, {
        installmentNumber: null,
        totalInstallments: null,
      }),
    ),
    ...recurringRows.map((row) =>
      toItem("recurring", row, {
        installmentNumber: null,
        totalInstallments: null,
      }),
    ),
    ...installmentRows.map((row) =>
      toItem("installment", row, {
        installmentNumber: row.installmentNumber,
        totalInstallments: row.totalInstallments,
      }),
    ),
  ].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

  const categoryMap = new Map<string, string>();
  for (const item of allItems) {
    if (item.categoryId && item.categoryName) {
      categoryMap.set(item.categoryId, item.categoryName);
    }
  }

  const visibleItems = allItems.filter((item) => {
    if (filters.kind && item.kind !== filters.kind) return false;
    if (filters.status === "pending" && item.status !== "pending") return false;
    if (filters.status === "paid" && !isSettled(item.status)) return false;
    if (filters.categoryId && item.categoryId !== filters.categoryId) {
      return false;
    }
    if (filters.q && !matchesQuery(item.description, filters.q)) return false;
    return true;
  });

  const dueDate =
    !filters.allTime && card.dueDay
      ? clampDayOfMonth(year, month, card.dueDay)
      : null;

  const invoice = summarize(allItems);
  const visibleSummary = summarize(visibleItems);

  return {
    card: {
      id: card.id,
      name: card.name,
      institution: card.institution,
      dueDay: card.dueDay,
      status: card.status,
    },
    month: formatYearMonth(year, month),
    year,
    monthNumber: month,
    allTime: filters.allTime,
    dueDate,
    phase: invoicePhase(filters.allTime, dueDate, allItems),
    categories: [...categoryMap.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    items: visibleItems,
    invoice,
    visible: {
      amount: visibleSummary.amount,
      count: visibleSummary.count,
    },
  };
}

function chargeConditions(
  scope: {
    walletId: string;
    cardId: string;
    allTime: boolean;
    start: Date;
    end: Date;
  },
  columns: {
    walletId: AnyColumn;
    creditCardId: AnyColumn;
    status: AnyColumn;
    date: AnyColumn;
  },
): SQL[] {
  const conditions: SQL[] = [
    eq(columns.walletId, scope.walletId),
    eq(columns.creditCardId, scope.cardId),
    ne(columns.status, "canceled"),
  ];

  if (!scope.allTime) {
    conditions.push(gte(columns.date, scope.start));
    conditions.push(lte(columns.date, scope.end));
  }

  return conditions;
}

function toItem(
  kind: CardStatementKind,
  row: {
    id: string;
    description: string;
    amount: string;
    status: CardStatementItem["status"];
    occurredAt: Date;
    categoryId: string | null;
    categoryName: string | null;
    notes: string | null;
  },
  installment: {
    installmentNumber: number | null;
    totalInstallments: number | null;
  },
): CardStatementItem {
  return {
    id: `${kind}-${row.id}`,
    entryId: row.id,
    source: kind,
    kind,
    description: row.description,
    amount: toNumber(row.amount),
    status: row.status,
    occurredAt: row.occurredAt,
    categoryId: row.categoryId,
    categoryName: row.categoryName,
    installmentNumber: installment.installmentNumber,
    totalInstallments: installment.totalInstallments,
    notes: row.notes,
  };
}
