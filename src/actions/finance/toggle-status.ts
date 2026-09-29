"use server";

import { and, eq } from "drizzle-orm";

import { db } from "@/src/db";
import {
  expenses,
  incomes,
  installmentPlans,
  installments,
  recurringExpenseCharges,
  subscriptionCharges,
} from "@/src/db/schema";
import {
  ToggleEntryStatusSchema,
  type FinanceActionState,
} from "@/src/actions/finance/finance-schema";
import { requireActiveWallet } from "@/src/lib/require-active-wallet";
import { revalidateFinance } from "@/src/lib/finance/revalidate";

async function syncInstallmentPlan(planId: string, walletId: string) {
  const rows = await db.query.installments.findMany({
    where: and(
      eq(installments.installmentPlanId, planId),
      eq(installments.walletId, walletId),
    ),
  });

  const paidCount = rows.filter(
    (row) => row.status === "paid" || row.status === "received",
  ).length;

  await db
    .update(installmentPlans)
    .set({
      paidInstallments: paidCount,
      status:
        rows.length > 0 && paidCount >= rows.length ? "completed" : "active",
      updatedAt: new Date(),
    })
    .where(eq(installmentPlans.id, planId));
}

export async function toggleLedgerStatusAction(
  _prevState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const { walletId } = await requireActiveWallet();

  const parsed = ToggleEntryStatusSchema.safeParse({
    id: formData.get("id"),
    source: formData.get("source"),
    status: formData.get("status"),
  });

  if (!parsed.success) return { error: "Dados inválidos." };

  const { id, source, status } = parsed.data;

  if (source === "income") {
    if (status !== "pending" && status !== "received") {
      return { error: "Status inválido para ganho." };
    }

    const existing = await db.query.incomes.findFirst({
      where: and(eq(incomes.id, id), eq(incomes.walletId, walletId)),
    });
    if (!existing) return { error: "Ganho não encontrado." };

    await db
      .update(incomes)
      .set({ status, updatedAt: new Date() })
      .where(eq(incomes.id, id));
  } else if (source === "expense") {
    if (status !== "pending" && status !== "paid") {
      return { error: "Status inválido para gasto." };
    }

    const existing = await db.query.expenses.findFirst({
      where: and(eq(expenses.id, id), eq(expenses.walletId, walletId)),
    });
    if (!existing) return { error: "Gasto não encontrado." };

    await db
      .update(expenses)
      .set({ status, updatedAt: new Date() })
      .where(eq(expenses.id, id));
  } else if (source === "subscription") {
    if (status !== "pending" && status !== "paid") {
      return { error: "Status inválido para assinatura." };
    }

    const existing = await db.query.subscriptionCharges.findFirst({
      where: and(
        eq(subscriptionCharges.id, id),
        eq(subscriptionCharges.walletId, walletId),
      ),
    });
    if (!existing) return { error: "Cobrança não encontrada." };

    await db
      .update(subscriptionCharges)
      .set({ status, updatedAt: new Date() })
      .where(eq(subscriptionCharges.id, id));
  } else if (source === "recurring") {
    if (status !== "pending" && status !== "paid") {
      return { error: "Status inválido para recorrente." };
    }

    const existing = await db.query.recurringExpenseCharges.findFirst({
      where: and(
        eq(recurringExpenseCharges.id, id),
        eq(recurringExpenseCharges.walletId, walletId),
      ),
    });
    if (!existing) return { error: "Cobrança não encontrada." };

    await db
      .update(recurringExpenseCharges)
      .set({ status, updatedAt: new Date() })
      .where(eq(recurringExpenseCharges.id, id));
  } else {
    if (status !== "pending" && status !== "paid") {
      return { error: "Status inválido para parcela." };
    }

    const existing = await db.query.installments.findFirst({
      where: and(eq(installments.id, id), eq(installments.walletId, walletId)),
    });
    if (!existing) return { error: "Parcela não encontrada." };

    await db
      .update(installments)
      .set({ status, updatedAt: new Date() })
      .where(eq(installments.id, id));

    if (existing.installmentPlanId) {
      await syncInstallmentPlan(existing.installmentPlanId, walletId);
    }
  }

  revalidateFinance();
  return { success: true, data: { id } };
}
