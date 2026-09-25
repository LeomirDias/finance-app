"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/src/db";
import { recurrentTransactions } from "@/src/db/schema";
import {
  RecurrentSchema,
  type FinanceActionState,
} from "@/src/actions/finance/finance-schema";
import { requireActiveWallet } from "@/src/lib/require-active-wallet";
import { parseDateOnly, roundMoney } from "@/src/lib/finance/dates";

function revalidateFinance() {
  revalidatePath("/");
  revalidatePath("/lancamentos");
  revalidatePath("/ganhos");
  revalidatePath("/assinaturas");
  revalidatePath("/recorrentes");
}

export async function upsertRecurrentAction(
  _prevState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const { userId, walletId } = await requireActiveWallet();

  const parsed = RecurrentSchema.safeParse({
    id: formData.get("id") || undefined,
    description: formData.get("description"),
    amount: formData.get("amount"),
    recurrenceKind: formData.get("recurrenceKind"),
    dayOfMonth: formData.get("dayOfMonth"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") || undefined,
    paymentMethod: formData.get("paymentMethod"),
    categoryId: formData.get("categoryId") || undefined,
    creditCardId: formData.get("creditCardId") || undefined,
    status: formData.get("status") || "active",
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const type =
    data.recurrenceKind === "fixed_income" ? "income" : "expense";
  const amount = roundMoney(data.amount).toFixed(2);
  const startDate = parseDateOnly(data.startDate);
  const endDate = data.endDate ? parseDateOnly(data.endDate) : null;

  if (data.id) {
    const existing = await db.query.recurrentTransactions.findFirst({
      where: and(
        eq(recurrentTransactions.id, data.id),
        eq(recurrentTransactions.walletId, walletId),
      ),
    });

    if (!existing) {
      return { error: "Recorrência não encontrada." };
    }

    await db
      .update(recurrentTransactions)
      .set({
        description: data.description,
        amount,
        type,
        status: data.status,
        recurrenceKind: data.recurrenceKind,
        frequency: "monthly",
        dayOfMonth: data.dayOfMonth,
        startDate,
        endDate,
        paymentMethod: data.paymentMethod,
        categoryId: data.categoryId ?? null,
        creditCardId: data.creditCardId ?? null,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(recurrentTransactions.id, data.id));

    revalidateFinance();
    return { success: true, data: { id: data.id } };
  }

  const [created] = await db
    .insert(recurrentTransactions)
    .values({
      walletId,
      description: data.description,
      amount,
      type,
      status: data.status,
      recurrenceKind: data.recurrenceKind,
      frequency: "monthly",
      dayOfMonth: data.dayOfMonth,
      startDate,
      endDate,
      paymentMethod: data.paymentMethod,
      categoryId: data.categoryId ?? null,
      creditCardId: data.creditCardId ?? null,
      createdByUserId: userId,
      notes: data.notes ?? null,
    })
    .returning({ id: recurrentTransactions.id });

  revalidateFinance();
  return { success: true, data: { id: created!.id } };
}

export async function deactivateRecurrentAction(
  _prevState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const { walletId } = await requireActiveWallet();
  const id = String(formData.get("id") ?? "");

  if (!id) return { error: "Recorrência inválida." };

  const existing = await db.query.recurrentTransactions.findFirst({
    where: and(
      eq(recurrentTransactions.id, id),
      eq(recurrentTransactions.walletId, walletId),
    ),
  });

  if (!existing) return { error: "Recorrência não encontrada." };

  await db
    .update(recurrentTransactions)
    .set({ status: "inactive", updatedAt: new Date() })
    .where(eq(recurrentTransactions.id, id));

  revalidateFinance();
  return { success: true, data: { id } };
}
