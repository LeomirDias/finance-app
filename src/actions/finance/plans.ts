"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/src/db";
import {
  fixedIncomes,
  recurringExpenses,
  subscriptions,
} from "@/src/db/schema";
import {
  PlanSchema,
  type FinanceActionState,
} from "@/src/actions/finance/finance-schema";
import { requireActiveWallet } from "@/src/lib/require-active-wallet";
import { parseDateOnly, roundMoney } from "@/src/lib/finance/dates";
import { revalidateFinance } from "@/src/lib/finance/revalidate";

type PlanTable =
  | typeof fixedIncomes
  | typeof recurringExpenses
  | typeof subscriptions;

async function upsertPlan(
  table: PlanTable,
  formData: FormData,
  withCard: boolean,
): Promise<FinanceActionState> {
  const { userId, walletId } = await requireActiveWallet();

  const parsed = PlanSchema.safeParse({
    id: formData.get("id") || undefined,
    description: formData.get("description"),
    amount: formData.get("amount"),
    dayOfMonth: formData.get("dayOfMonth"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
    paymentMethod: formData.get("paymentMethod"),
    categoryId: formData.get("categoryId") || undefined,
    creditCardId: withCard ? formData.get("creditCardId") || undefined : undefined,
    status: formData.get("status") || "active",
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const amount = roundMoney(data.amount).toFixed(2);
  const startDate = parseDateOnly(data.startDate);
  const endDate = data.endDate ? parseDateOnly(data.endDate) : null;
  const shared = {
    description: data.description,
    amount,
    status: data.status,
    dayOfMonth: data.dayOfMonth,
    startDate,
    endDate,
    paymentMethod: data.paymentMethod,
    categoryId: data.categoryId ?? null,
    notes: data.notes ?? null,
    updatedAt: new Date(),
  };

  if (data.id) {
    const existing =
      table === fixedIncomes
        ? await db.query.fixedIncomes.findFirst({
            where: and(eq(fixedIncomes.id, data.id), eq(fixedIncomes.walletId, walletId)),
          })
        : table === subscriptions
          ? await db.query.subscriptions.findFirst({
              where: and(
                eq(subscriptions.id, data.id),
                eq(subscriptions.walletId, walletId),
              ),
            })
          : await db.query.recurringExpenses.findFirst({
              where: and(
                eq(recurringExpenses.id, data.id),
                eq(recurringExpenses.walletId, walletId),
              ),
            });

    if (!existing) return { error: "Cadastro não encontrado." };

    if (table === fixedIncomes) {
      await db.update(fixedIncomes).set(shared).where(eq(fixedIncomes.id, data.id));
    } else if (table === subscriptions) {
      await db
        .update(subscriptions)
        .set({ ...shared, creditCardId: data.creditCardId ?? null })
        .where(eq(subscriptions.id, data.id));
    } else {
      await db
        .update(recurringExpenses)
        .set({ ...shared, creditCardId: data.creditCardId ?? null })
        .where(eq(recurringExpenses.id, data.id));
    }

    revalidateFinance();
    return { success: true, data: { id: data.id } };
  }

  const values = {
    walletId,
    ...shared,
    createdByUserId: userId,
  };

  if (table === fixedIncomes) {
    const [created] = await db
      .insert(fixedIncomes)
      .values(values)
      .returning({ id: fixedIncomes.id });
    revalidateFinance();
    return { success: true, data: { id: created!.id } };
  }

  const withCardValues = {
    ...values,
    creditCardId: data.creditCardId ?? null,
  };

  if (table === subscriptions) {
    const [created] = await db
      .insert(subscriptions)
      .values(withCardValues)
      .returning({ id: subscriptions.id });
    revalidateFinance();
    return { success: true, data: { id: created!.id } };
  }

  const [created] = await db
    .insert(recurringExpenses)
    .values(withCardValues)
    .returning({ id: recurringExpenses.id });
  revalidateFinance();
  return { success: true, data: { id: created!.id } };
}

async function deactivatePlan(
  table: PlanTable,
  formData: FormData,
): Promise<FinanceActionState> {
  const { walletId } = await requireActiveWallet();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Cadastro inválido." };

  const existing =
    table === fixedIncomes
      ? await db.query.fixedIncomes.findFirst({
          where: and(eq(fixedIncomes.id, id), eq(fixedIncomes.walletId, walletId)),
        })
      : table === subscriptions
        ? await db.query.subscriptions.findFirst({
            where: and(
              eq(subscriptions.id, id),
              eq(subscriptions.walletId, walletId),
            ),
          })
        : await db.query.recurringExpenses.findFirst({
            where: and(
              eq(recurringExpenses.id, id),
              eq(recurringExpenses.walletId, walletId),
            ),
          });

  if (!existing) return { error: "Cadastro não encontrado." };

  if (table === fixedIncomes) {
    await db
      .update(fixedIncomes)
      .set({ status: "inactive", updatedAt: new Date() })
      .where(eq(fixedIncomes.id, id));
  } else if (table === subscriptions) {
    await db
      .update(subscriptions)
      .set({ status: "inactive", updatedAt: new Date() })
      .where(eq(subscriptions.id, id));
  } else {
    await db
      .update(recurringExpenses)
      .set({ status: "inactive", updatedAt: new Date() })
      .where(eq(recurringExpenses.id, id));
  }

  revalidateFinance();
  return { success: true, data: { id } };
}

export async function upsertFixedIncomeAction(
  prev: FinanceActionState,
  formData: FormData,
) {
  return upsertPlan(fixedIncomes, formData, false);
}

export async function deactivateFixedIncomeAction(
  _prev: FinanceActionState,
  formData: FormData,
) {
  return deactivatePlan(fixedIncomes, formData);
}

export async function upsertSubscriptionAction(
  _prev: FinanceActionState,
  formData: FormData,
) {
  return upsertPlan(subscriptions, formData, true);
}

export async function deactivateSubscriptionAction(
  _prev: FinanceActionState,
  formData: FormData,
) {
  return deactivatePlan(subscriptions, formData);
}

export async function upsertRecurringExpenseAction(
  _prev: FinanceActionState,
  formData: FormData,
) {
  return upsertPlan(recurringExpenses, formData, true);
}

export async function deactivateRecurringExpenseAction(
  _prev: FinanceActionState,
  formData: FormData,
) {
  return deactivatePlan(recurringExpenses, formData);
}
