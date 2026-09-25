"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/src/db";
import { installmentPlans, transactions } from "@/src/db/schema";
import {
  TransactionSchema,
  type FinanceActionState,
} from "@/src/actions/finance/finance-schema";
import { requireActiveWallet } from "@/src/lib/require-active-wallet";
import { parseDateOnly, roundMoney } from "@/src/lib/finance/dates";

function revalidateFinance() {
  revalidatePath("/");
  revalidatePath("/lancamentos");
  revalidatePath("/parcelamentos");
}

export async function upsertTransactionAction(
  _prevState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const { userId, walletId } = await requireActiveWallet();

  const parsed = TransactionSchema.safeParse({
    id: formData.get("id") || undefined,
    description: formData.get("description"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    status: formData.get("status"),
    paymentMethod: formData.get("paymentMethod"),
    categoryId: formData.get("categoryId") || undefined,
    creditCardId: formData.get("creditCardId") || undefined,
    transactionDate: formData.get("transactionDate"),
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const amount = roundMoney(data.amount).toFixed(2);
  const transactionDate = parseDateOnly(data.transactionDate);

  if (data.id) {
    const existing = await db.query.transactions.findFirst({
      where: and(
        eq(transactions.id, data.id),
        eq(transactions.walletId, walletId),
      ),
    });

    if (!existing) {
      return { error: "Lançamento não encontrado." };
    }

    if (existing.installmentPlanId || existing.recurrentTransactionId) {
      return {
        error:
          "Edite apenas lançamentos avulsos por aqui. Parcelas e recorrentes têm fluxos próprios.",
      };
    }

    await db
      .update(transactions)
      .set({
        description: data.description,
        amount,
        type: data.type,
        status: data.status,
        paymentMethod: data.paymentMethod,
        categoryId: data.categoryId ?? null,
        creditCardId: data.creditCardId ?? null,
        transactionDate,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(transactions.id, data.id));

    revalidateFinance();
    return { success: true, data: { id: data.id } };
  }

  const [created] = await db
    .insert(transactions)
    .values({
      walletId,
      description: data.description,
      amount,
      type: data.type,
      status: data.status,
      paymentMethod: data.paymentMethod,
      categoryId: data.categoryId ?? null,
      creditCardId: data.creditCardId ?? null,
      transactionDate,
      notes: data.notes ?? null,
      createdByUserId: userId,
    })
    .returning({ id: transactions.id });

  revalidateFinance();
  return { success: true, data: { id: created!.id } };
}

export async function deleteTransactionAction(
  _prevState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const { walletId } = await requireActiveWallet();
  const id = String(formData.get("id") ?? "");

  if (!id) return { error: "Lançamento inválido." };

  const existing = await db.query.transactions.findFirst({
    where: and(eq(transactions.id, id), eq(transactions.walletId, walletId)),
  });

  if (!existing) return { error: "Lançamento não encontrado." };

  await db
    .update(transactions)
    .set({ status: "canceled", updatedAt: new Date() })
    .where(eq(transactions.id, id));

  revalidateFinance();
  return { success: true, data: { id } };
}

export async function toggleTransactionStatusAction(
  _prevState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const { walletId } = await requireActiveWallet();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as
    | "pending"
    | "paid"
    | "received"
    | "canceled";

  if (!id || !["pending", "paid", "received", "canceled"].includes(status)) {
    return { error: "Dados inválidos." };
  }

  const existing = await db.query.transactions.findFirst({
    where: and(eq(transactions.id, id), eq(transactions.walletId, walletId)),
  });

  if (!existing) return { error: "Lançamento não encontrado." };

  await db
    .update(transactions)
    .set({ status, updatedAt: new Date() })
    .where(eq(transactions.id, id));

  if (existing.installmentPlanId && (status === "paid" || status === "pending")) {
    const siblings = await db.query.transactions.findMany({
      where: and(
        eq(transactions.installmentPlanId, existing.installmentPlanId),
        eq(transactions.walletId, walletId),
      ),
    });

    const paidCount = siblings.filter((s) => {
      const sStatus = s.id === id ? status : s.status;
      return sStatus === "paid" || sStatus === "received";
    }).length;

    await db
      .update(installmentPlans)
      .set({
        paidInstallments: paidCount,
        status: paidCount >= siblings.length ? "completed" : "active",
        updatedAt: new Date(),
      })
      .where(eq(installmentPlans.id, existing.installmentPlanId));
  }

  revalidateFinance();
  return { success: true, data: { id } };
}
