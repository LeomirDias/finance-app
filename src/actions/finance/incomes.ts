"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { incomes } from "@/src/db/schema";
import {
  IncomeSchema,
  type FinanceActionState,
} from "@/src/actions/finance/finance-schema";
import { requireActiveWallet } from "@/src/lib/require-active-wallet";
import { parseDateOnly, roundMoney } from "@/src/lib/finance/dates";
import { revalidateFinance } from "@/src/lib/finance/revalidate";

export async function upsertIncomeAction(
  _prevState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const { userId, walletId } = await requireActiveWallet();

  const parsed = IncomeSchema.safeParse({
    id: formData.get("id") || undefined,
    description: formData.get("description"),
    amount: formData.get("amount"),
    status: formData.get("status"),
    paymentMethod: formData.get("paymentMethod"),
    categoryId: formData.get("categoryId") || undefined,
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
    const existing = await db.query.incomes.findFirst({
      where: and(eq(incomes.id, data.id), eq(incomes.walletId, walletId)),
    });

    if (!existing) return { error: "Ganho não encontrado." };

    if (existing.fixedIncomeId) {
      return {
        error: "Edite a renda fixa em Ganhos. Este lançamento foi gerado por ela.",
      };
    }

    await db
      .update(incomes)
      .set({
        description: data.description,
        amount,
        status: data.status,
        paymentMethod: data.paymentMethod,
        categoryId: data.categoryId ?? null,
        transactionDate,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(incomes.id, data.id));

    revalidateFinance();
    return { success: true, data: { id: data.id } };
  }

  const [created] = await db
    .insert(incomes)
    .values({
      walletId,
      description: data.description,
      amount,
      status: data.status,
      paymentMethod: data.paymentMethod,
      categoryId: data.categoryId ?? null,
      transactionDate,
      notes: data.notes ?? null,
      createdByUserId: userId,
    })
    .returning({ id: incomes.id });

  revalidateFinance();
  return { success: true, data: { id: created!.id } };
}
