import { Suspense } from "react";

import { PageHeader } from "@/src/components/global/page-header";
import { listCategories, listExpenses } from "@/src/actions/finance/queries";
import { listCreditCards } from "@/src/actions/finance/credit-cards";
import { LedgerToolbar } from "@/src/app/(app)/_components/ledger-toolbar";
import { LedgerList } from "@/src/app/(app)/_components/ledger-list";
import { ExpenseFormDialog } from "@/src/app/(app)/gastos/_components/expense-form";
import { getCurrentMonthDateFilters } from "@/src/lib/finance/dates";

type GastosPageProps = {
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

export default async function GastosPage({ searchParams }: GastosPageProps) {
  const params = await searchParams;
  const monthDefaults = getCurrentMonthDateFilters();
  const filters = {
    q: params.q,
    from: params.from ?? monthDefaults.from,
    to: params.to ?? monthDefaults.to,
    card: params.card,
    category: params.category,
    payment: params.payment,
  };

  const [categories, cards, rows] = await Promise.all([
    listCategories(),
    listCreditCards(),
    listExpenses(filters),
  ]);

  const expenseCategories = categories
    .filter((category) => category.type === "expense")
    .map((category) => ({ id: category.id, name: category.name }));
  const cardOptions = cards.map((card) => ({ id: card.id, name: card.name }));
  const activeCards = cards
    .filter((card) => card.status === "active")
    .map((card) => ({
      id: card.id,
      name: card.name,
      dueDate: card.dueDate,
    }));

  return (
    <>
      <PageHeader
        title="Gastos"
        subtitle="Somente gastos avulsos do período"
        backHref="/"
        backLabel="Início"
      />

      <main className="page-container space-y-8 pb-20 sm:pb-10">
        <Suspense fallback={null}>
          <LedgerToolbar
            filterCategories={expenseCategories}
            cards={cardOptions}
            count={rows.length}
            countLabel={{ singular: "gasto", plural: "gastos" }}
            basePath="/gastos"
            mode="expense"
            defaultFrom={monthDefaults.from}
            defaultTo={monthDefaults.to}
            action={
              <ExpenseFormDialog
                key={params.novo === "1" ? "novo" : "lista"}
                categories={expenseCategories}
                cards={activeCards}
                defaultOpen={params.novo === "1"}
              />
            }
          />
        </Suspense>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Lançamentos
          </h2>
          <LedgerList
            kind="expense"
            source="expense"
            categories={expenseCategories}
            cards={activeCards}
            items={rows.map((row) => ({
              id: row.id,
              description: row.description,
              amount: row.amount,
              status: row.status,
              paymentMethod: row.paymentMethod,
              transactionDate: row.transactionDate,
              categoryId: row.categoryId,
              categoryName: row.categoryName,
              creditCardId: row.creditCardId,
              creditCardName: row.creditCardName,
              purchasedAt: row.purchasedAt,
              notes: row.notes,
            }))}
          />
        </section>
      </main>
    </>
  );
}
