"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/src/db";
import { installmentPlans, transactions } from "@/src/db/schema";
import {
  InstallmentPlanSchema,
  type FinanceActionState,
} from "@/src/actions/finance/finance-schema";
import { requireActiveWallet } from "@/src/lib/require-active-wallet";
import {
  addMonths,
  parseDateOnly,
  roundMoney,
} from "@/src/lib/finance/dates";

export async function createInstallmentPlanAction(
  _prevState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const { userId, walletId } = await requireActiveWallet();

  const parsed = InstallmentPlanSchema.safeParse({
    description: formData.get("description"),
    totalAmount: formData.get("totalAmount"),
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
  const totalAmount = roundMoney(data.totalAmount);
  const installmentAmount = roundMoney(
    totalAmount / data.totalInstallments,
  );
  // Ajuste de centavos na última parcela
  const amounts = Array.from({ length: data.totalInstallments }, (_, i) => {
    if (i === data.totalInstallments - 1) {
      const sumPrev = roundMoney(installmentAmount * (data.totalInstallments - 1));
      return roundMoney(totalAmount - sumPrev);
    }
    return installmentAmount;
  });

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
      categoryId: data.categoryId ?? null,
      paymentMethod: data.paymentMethod,
      creditCardId: data.creditCardId ?? null,
      firstDueDate: firstDue,
      status: "active",
      createdByUserId: userId,
      notes: data.notes ?? null,
    })
    .returning({ id: installmentPlans.id });

  if (!plan) {
    return { error: "Não foi possível criar o parcelamento." };
  }

  await db.insert(transactions).values(
    amounts.map((amount, index) => ({
      walletId,
      description: `${data.description} (${index + 1}/${data.totalInstallments})`,
      amount: amount.toFixed(2),
      type: "expense" as const,
      status: "pending" as const,
      paymentMethod: data.paymentMethod,
      categoryId: data.categoryId ?? null,
      creditCardId: data.creditCardId ?? null,
      installmentPlanId: plan.id,
      installmentNumber: index + 1,
      transactionDate: addMonths(firstDue, index),
      createdByUserId: userId,
      notes: data.notes ?? null,
    })),
  );

  revalidatePath("/");
  revalidatePath("/lancamentos");
  revalidatePath("/parcelamentos");

  return { success: true, data: { id: plan.id } };
}

