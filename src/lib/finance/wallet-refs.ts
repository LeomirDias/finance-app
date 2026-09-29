import "server-only";

import { and, eq, type AnyColumn } from "drizzle-orm";

import { db } from "@/src/db";
import {
  categories,
  creditCards,
  expenses,
  fixedIncomes,
  incomes,
  installmentPlans,
  installments,
  recurringExpenseCharges,
  recurringExpenses,
  subscriptionCharges,
  subscriptions,
} from "@/src/db/schema";

type WalletRefResult =
  | { ok: true; categoryId: string | null; creditCardId: string | null }
  | { ok: false; fieldErrors: Record<string, string[]> };

export async function resolveWalletRefs(input: {
  walletId: string;
  categoryId?: string | null;
  creditCardId?: string | null;
}): Promise<WalletRefResult> {
  const fieldErrors: Record<string, string[]> = {};
  let categoryId: string | null = null;
  let creditCardId: string | null = null;

  if (input.categoryId) {
    const category = await db.query.categories.findFirst({
      where: and(
        eq(categories.id, input.categoryId),
        eq(categories.walletId, input.walletId),
      ),
      columns: { id: true },
    });

    if (!category) {
      fieldErrors.categoryId = ["Categoria não encontrada nesta carteira."];
    } else {
      categoryId = category.id;
    }
  }

  if (input.creditCardId) {
    const card = await db.query.creditCards.findFirst({
      where: and(
        eq(creditCards.id, input.creditCardId),
        eq(creditCards.walletId, input.walletId),
      ),
      columns: { id: true },
    });

    if (!card) {
      fieldErrors.creditCardId = ["Cartão não encontrado nesta carteira."];
    } else {
      creditCardId = card.id;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, fieldErrors };
  }

  return { ok: true, categoryId, creditCardId };
}

function sameWalletRef(
  column: AnyColumn,
  id: string,
  walletColumn: AnyColumn,
  walletId: string,
) {
  return and(eq(column, id), eq(walletColumn, walletId));
}

export async function detachCategoryFromWallet(walletId: string, categoryId: string) {
  const targets = [
    fixedIncomes,
    incomes,
    expenses,
    recurringExpenses,
    recurringExpenseCharges,
    subscriptions,
    subscriptionCharges,
    installmentPlans,
    installments,
  ] as const;

  await Promise.all(
    targets.map((table) =>
      db
        .update(table)
        .set({ categoryId: null })
        .where(
          sameWalletRef(table.categoryId, categoryId, table.walletId, walletId),
        ),
    ),
  );
}

export async function detachCreditCardFromWallet(
  walletId: string,
  creditCardId: string,
) {
  const targets = [
    expenses,
    recurringExpenses,
    recurringExpenseCharges,
    subscriptions,
    subscriptionCharges,
    installmentPlans,
    installments,
  ] as const;

  await Promise.all(
    targets.map((table) =>
      db
        .update(table)
        .set({ creditCardId: null })
        .where(
          sameWalletRef(
            table.creditCardId,
            creditCardId,
            table.walletId,
            walletId,
          ),
        ),
    ),
  );
}
