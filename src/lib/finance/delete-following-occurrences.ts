import { and, eq, gte } from "drizzle-orm";

import { db } from "@/src/db";
import {
  fixedIncomes,
  incomes,
  installmentPlans,
  installments,
  recurringExpenseCharges,
  recurringExpenses,
  subscriptionCharges,
  subscriptions,
} from "@/src/db/schema";
import { startOfFollowingBusinessMonth } from "@/src/lib/finance/dates";

/**
 * Remove o cadastro e apaga em definitivo os lançamentos a partir do mês seguinte.
 * Registros do mês atual e dos meses anteriores permanecem, sem vínculo com o plano.
 */
export async function deleteFixedIncomeAndFollowingMonths(
  walletId: string,
  id: string,
) {
  const from = startOfFollowingBusinessMonth();

  await db
    .delete(incomes)
    .where(
      and(
        eq(incomes.walletId, walletId),
        eq(incomes.fixedIncomeId, id),
        gte(incomes.transactionDate, from),
      ),
    );

  const [deleted] = await db
    .delete(fixedIncomes)
    .where(and(eq(fixedIncomes.id, id), eq(fixedIncomes.walletId, walletId)))
    .returning({ id: fixedIncomes.id });

  return deleted ?? null;
}

export async function deleteSubscriptionAndFollowingMonths(
  walletId: string,
  id: string,
) {
  const from = startOfFollowingBusinessMonth();

  await db
    .delete(subscriptionCharges)
    .where(
      and(
        eq(subscriptionCharges.walletId, walletId),
        eq(subscriptionCharges.subscriptionId, id),
        gte(subscriptionCharges.dueDate, from),
      ),
    );

  const [deleted] = await db
    .delete(subscriptions)
    .where(and(eq(subscriptions.id, id), eq(subscriptions.walletId, walletId)))
    .returning({ id: subscriptions.id });

  return deleted ?? null;
}

export async function deleteRecurringExpenseAndFollowingMonths(
  walletId: string,
  id: string,
) {
  const from = startOfFollowingBusinessMonth();

  await db
    .delete(recurringExpenseCharges)
    .where(
      and(
        eq(recurringExpenseCharges.walletId, walletId),
        eq(recurringExpenseCharges.recurringExpenseId, id),
        gte(recurringExpenseCharges.dueDate, from),
      ),
    );

  const [deleted] = await db
    .delete(recurringExpenses)
    .where(
      and(
        eq(recurringExpenses.id, id),
        eq(recurringExpenses.walletId, walletId),
      ),
    )
    .returning({ id: recurringExpenses.id });

  return deleted ?? null;
}

export async function deleteInstallmentPlanAndFollowingMonths(
  walletId: string,
  id: string,
) {
  const from = startOfFollowingBusinessMonth();

  await db
    .delete(installments)
    .where(
      and(
        eq(installments.walletId, walletId),
        eq(installments.installmentPlanId, id),
        gte(installments.dueDate, from),
      ),
    );

  const [deleted] = await db
    .delete(installmentPlans)
    .where(
      and(eq(installmentPlans.id, id), eq(installmentPlans.walletId, walletId)),
    )
    .returning({ id: installmentPlans.id });

  return deleted ?? null;
}
