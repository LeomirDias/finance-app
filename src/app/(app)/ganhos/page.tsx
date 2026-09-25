import { Suspense } from "react";

import { PageHeader } from "@/src/components/global/page-header";
import {
  listCategories,
  listTransactions,
} from "@/src/actions/finance/queries";
import { listCreditCards } from "@/src/actions/finance/credit-cards";
import { LancamentosToolbar } from "@/src/app/(app)/lancamentos/_components/lancamentos-toolbar";
import { TransactionList } from "@/src/app/(app)/lancamentos/_components/transaction-list";
import { getCurrentMonthDateFilters } from "@/src/lib/finance/dates";
import type { EntryKind } from "@/src/app/(app)/lancamentos/_components/entry-form";

type GanhosPageProps = {
  searchParams: Promise<{
    novo?: string;
    q?: string;
    from?: string;
    to?: string;
    card?: string;
    category?: string;
    payment?: string;
  }>;
};

const OPEN_KINDS = new Set<EntryKind>(["income", "fixed_income"]);

function resolveOpenKind(novo?: string): EntryKind | undefined {
  if (!novo) return undefined;
  if (novo === "1") return "income";
  if (OPEN_KINDS.has(novo as EntryKind)) return novo as EntryKind;
  return undefined;
}

export default async function GanhosPage({ searchParams }: GanhosPageProps) {
  const params = await searchParams;
  const monthDefaults = getCurrentMonthDateFilters();
  const filters = {
    type: "income" as const,
    q: params.q,
    from: params.from ?? monthDefaults.from,
    to: params.to ?? monthDefaults.to,
    card: params.card,
    category: params.category,
    payment: params.payment,
  };

  const [categories, cards, transactions] = await Promise.all([
    listCategories(),
    listCreditCards(),
    listTransactions(filters),
  ]);

  const incomeCategories = categories.filter((c) => c.type === "income");
  const categoryOptions = incomeCategories.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
  }));

  const cardOptions = cards.map((c) => ({ id: c.id, name: c.name }));
  const activeCards = cards
    .filter((c) => c.status === "active")
    .map((c) => ({ id: c.id, name: c.name }));

  const defaultKind = resolveOpenKind(params.novo);

  return (
    <>
      <PageHeader
        title="Ganhos"
        subtitle="Ganhos do mês atual — use o filtro para outros períodos"
        backHref="/"
        backLabel="Início"
      />

      <main className="page-container space-y-8 pb-20 sm:pb-10">
        <Suspense fallback={null}>
          <LancamentosToolbar
            categories={categoryOptions}
            filterCategories={categoryOptions.map(({ id, name }) => ({
              id,
              name,
            }))}
            cards={cardOptions}
            activeCards={activeCards}
            defaultOpenForm={!!defaultKind}
            defaultKind={defaultKind}
            transactionCount={transactions.length}
            mode="income"
            basePath="/ganhos"
            countLabel={{ singular: "ganho", plural: "ganhos" }}
            defaultFrom={monthDefaults.from}
            defaultTo={monthDefaults.to}
          />
        </Suspense>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Resultados
          </h2>
          <TransactionList
            categories={categoryOptions}
            cards={activeCards}
            items={transactions.map((tx) => ({
              id: tx.id,
              description: tx.description,
              amount: tx.amount,
              type: tx.type,
              status: tx.status,
              paymentMethod: tx.paymentMethod,
              transactionDate: tx.transactionDate,
              categoryId: tx.categoryId,
              categoryName: tx.categoryName,
              creditCardId: tx.creditCardId,
              creditCardName: tx.creditCardName,
              installmentNumber: tx.installmentNumber,
              installmentPlanId: tx.installmentPlanId,
              recurrentTransactionId: tx.recurrentTransactionId,
              notes: tx.notes,
            }))}
          />
        </section>
      </main>
    </>
  );
}
