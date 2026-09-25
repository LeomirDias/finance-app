import { Suspense } from "react";

import { PageHeader } from "@/src/components/global/page-header";
import {
  listCategories,
  listRecurrents,
  listTransactions,
} from "@/src/actions/finance/queries";
import { listCreditCards } from "@/src/actions/finance/credit-cards";
import { LancamentosToolbar } from "@/src/app/(app)/lancamentos/_components/lancamentos-toolbar";
import { RecurrentList } from "@/src/app/(app)/lancamentos/_components/recurrent-list";
import { TransactionList } from "@/src/app/(app)/lancamentos/_components/transaction-list";

type LancamentosPageProps = {
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

export default async function LancamentosPage({
  searchParams,
}: LancamentosPageProps) {
  const params = await searchParams;
  const filters = {
    q: params.q,
    from: params.from,
    to: params.to,
    card: params.card,
    category: params.category,
    payment: params.payment,
  };

  const [categories, cards, recurrents, transactions] = await Promise.all([
    listCategories(),
    listCreditCards(),
    listRecurrents(),
    listTransactions(filters),
  ]);

  const categoryOptions = categories.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
  }));

  const cardOptions = cards.map((c) => ({ id: c.id, name: c.name }));
  const activeCards = cards
    .filter((c) => c.status === "active")
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <>
      <PageHeader
        title="Lançamentos"
        subtitle="Filtre e cadastre ganhos, gastos, parcelas e assinaturas"
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
            defaultOpenForm={params.novo === "1"}
            transactionCount={transactions.length}
          />
        </Suspense>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Resultados
          </h2>
          <TransactionList
            items={transactions.map((tx) => ({
              id: tx.id,
              description: tx.description,
              amount: tx.amount,
              type: tx.type,
              status: tx.status,
              paymentMethod: tx.paymentMethod,
              transactionDate: tx.transactionDate,
              categoryName: tx.categoryName,
              creditCardName: tx.creditCardName,
              installmentNumber: tx.installmentNumber,
            }))}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Assinaturas e recorrentes
          </h2>
          <RecurrentList
            items={recurrents.map((r) => ({
              id: r.id,
              description: r.description,
              amount: r.amount,
              recurrenceKind: r.recurrenceKind,
              dayOfMonth: r.dayOfMonth,
              status: r.status,
              category: r.category,
              creditCard: r.creditCard,
            }))}
          />
        </section>
      </main>
    </>
  );
}
