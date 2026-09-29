"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { installmentPlans, installments } from "@/src/db/schema";
import {
  DeleteByIdSchema,
  InstallmentPlanSchema,
  type FinanceActionState,
} from "@/src/actions/finance/finance-schema";
import { resolveWalletRefs } from "@/src/lib/finance/wallet-refs";
import { requireActiveWallet } from "@/src/lib/require-active-wallet";
import {
  addMonths,
  parseDateOnly,
  roundMoney,
} from "@/src/lib/finance/dates";
import { deleteInstallmentPlanAndFollowingMonths } from "@/src/lib/finance/delete-following-occurrences";
import { revalidateFinance } from "@/src/lib/finance/revalidate";

export async function createInstallmentPlanAction(
  _prevState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const { userId, walletId } = await requireActiveWallet();

  const parsed = InstallmentPlanSchema.safeParse({
    description: formData.get("description"),
    installmentAmount: formData.get("installmentAmount"),
    totalInstallments: formData.get("totalInstallments"),
    firstDueDate: formData.get("firstDueDate"),
    paymentMethod: formData.get("paymentMethod"),
    categoryId: formData.get("categoryId") || undefined,
    creditCardId: formData.get("creditCardId") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const refs = await resolveWalletRefs({
    walletId,
    categoryId: data.categoryId,
    creditCardId: data.creditCardId,
  });

  if (!refs.ok) return { fieldErrors: refs.fieldErrors };

  const installmentAmount = roundMoney(data.installmentAmount);
  const totalAmount = roundMoney(installmentAmount * data.totalInstallments);
  const amounts = Array.from(
    { length: data.totalInstallments },
    () => installmentAmount,
  );

  const firstDue = parseDateOnly(data.firstDueDate);

  const [plan] = await db
    .insert(installmentPlans)
    .values({
      walletId,
      description: data.description,
      totalAmount: totalAmount.toFixed(2),
      installmentAmount: installmentAmount.toFixed(2),
      totalInstallments: data.totalInstallments,
      paidInstallments: 0,
      categoryId: refs.categoryId,
      paymentMethod: data.paymentMethod,
      creditCardId: refs.creditCardId,
      firstDueDate: firstDue,
      status: "active",
      createdByUserId: userId,
      notes: data.notes ?? null,
    })
    .returning({ id: installmentPlans.id });

  if (!plan) {
    return { error: "Não foi possível criar o parcelamento." };
  }

  await db.insert(installments).values(
    amounts.map((amount, index) => ({
      walletId,
      installmentPlanId: plan.id,
      description: `${data.description} (${index + 1}/${data.totalInstallments})`,
      amount: amount.toFixed(2),
      status: "pending" as const,
      paymentMethod: data.paymentMethod,
      categoryId: refs.categoryId,
      creditCardId: refs.creditCardId,
      installmentNumber: index + 1,
      dueDate: addMonths(firstDue, index),
      createdByUserId: userId,
      notes: data.notes ?? null,
    })),
  );

  revalidateFinance();

  return { success: true, data: { id: plan.id } };
}

export async function deleteInstallmentPlanAction(
  _prevState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const { walletId } = await requireActiveWallet();

  const parsed = DeleteByIdSchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    return { error: "Parcelamento inválido." };
  }

  const { id } = parsed.data;

  const existing = await db.query.installmentPlans.findFirst({
    where: and(
      eq(installmentPlans.id, id),
      eq(installmentPlans.walletId, walletId),
    ),
  });

  if (!existing) {
    return { error: "Parcelamento não encontrado." };
  }

  const deleted = await deleteInstallmentPlanAndFollowingMonths(walletId, id);

  if (!deleted) {
    return { error: "Não foi possível excluir o parcelamento." };
  }

  revalidateFinance();

  return { success: true, data: { id: deleted.id } };
}

