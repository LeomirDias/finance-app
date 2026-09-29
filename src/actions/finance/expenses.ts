"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { expenses } from "@/src/db/schema";
import {
  ExpenseSchema,
  type FinanceActionState,
} from "@/src/actions/finance/finance-schema";
import { requireActiveWallet } from "@/src/lib/require-active-wallet";
import { parseDateOnly, roundMoney } from "@/src/lib/finance/dates";
import { revalidateFinance } from "@/src/lib/finance/revalidate";

export async function upsertExpenseAction(
  _prevState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const { userId, walletId } = await requireActiveWallet();

  const parsed = ExpenseSchema.safeParse({
    id: formData.get("id") || undefined,
    description: formData.get("description"),
    amount: formData.get("amount"),
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
    const existing = await db.query.expenses.findFirst({
      where: and(eq(expenses.id, data.id), eq(expenses.walletId, walletId)),
    });

    if (!existing) return { error: "Gasto não encontrado." };

    await db
      .update(expenses)
      .set({
        description: data.description,
        amount,
        status: data.status,
        paymentMethod: data.paymentMethod,
        categoryId: data.categoryId ?? null,
        creditCardId: data.creditCardId ?? null,
        transactionDate,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, data.id));

    revalidateFinance();
    return { success: true, data: { id: data.id } };
  }

  const [created] = await db
    .insert(expenses)
    .values({
      walletId,
      description: data.description,
      amount,
      status: data.status,
      paymentMethod: data.paymentMethod,
      categoryId: data.categoryId ?? null,
      creditCardId: data.creditCardId ?? null,
      transactionDate,
      notes: data.notes ?? null,
      createdByUserId: userId,
    })
    .returning({ id: expenses.id });

  revalidateFinance();
  return { success: true, data: { id: created!.id } };
}
