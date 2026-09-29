import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Ganhos",
};

import { PageHeader } from "@/src/components/global/page-header";
import {
  listCategories,
  listIncomes,
  listPlanSummaries,
} from "@/src/actions/finance/queries";
import { LedgerToolbar } from "@/src/app/(app)/_components/ledger-toolbar";
import { LedgerList } from "@/src/app/(app)/_components/ledger-list";
import {
  CreatePlanButton,
  RecurrentPlansGrid,
} from "@/src/app/(app)/_components/recurrent-plans-ui";
import { IncomeFormDialog } from "@/src/app/(app)/ganhos/_components/income-form";
import {
  deactivateFixedIncomeAction,
  deleteFixedIncomeAction,
  upsertFixedIncomeAction,
} from "@/src/actions/finance/plans";
import { getCurrentMonthDateFilters } from "@/src/lib/finance/dates";

type GanhosPageProps = {
  searchParams: Promise<{
    novo?: string;
    q?: string;
    from?: string;
    to?: string;
    category?: string;
    payment?: string;
  }>;
};

export default async function GanhosPage({ searchParams }: GanhosPageProps) {
  const params = await searchParams;
  const monthDefaults = getCurrentMonthDateFilters();
  const filters = {
    q: params.q,
    from: params.from ?? monthDefaults.from,
    to: params.to ?? monthDefaults.to,
    category: params.category,
    payment: params.payment,
  };

  const [categories, rows, fixedIncomes] = await Promise.all([
    listCategories(),
    listIncomes(filters),
    listPlanSummaries("fixed_income"),
  ]);

  const incomeCategories = categories
    .filter((category) => category.type === "income")
    .map((category) => ({
      id: category.id,
      name: category.name,
      type: category.type,
    }));

  const defaultKind =
    params.novo === "fixed_income" ? "fixed_income" : "income";

  return (
    <>
      <PageHeader
        title="Ganhos"
        subtitle="Ganhos avulsos e rendas fixas do mês"
        backHref="/"
        backLabel="Início"
      />

      <main className="page-container space-y-8 pb-20 sm:pb-10">
        <Suspense fallback={null}>
          <LedgerToolbar
            filterCategories={incomeCategories}
            cards={[]}
            count={rows.length}
            countLabel={{ singular: "ganho", plural: "ganhos" }}
            basePath="/ganhos"
            mode="income"
            defaultFrom={monthDefaults.from}
            defaultTo={monthDefaults.to}
            action={
              <IncomeFormDialog
                categories={incomeCategories}
                defaultOpen={params.novo === "1" || params.novo === "fixed_income"}
                defaultKind={defaultKind}
              />
            }
          />
        </Suspense>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Lançamentos
          </h2>
          <LedgerList
            kind="income"
            source="income"
            categories={incomeCategories}
            items={rows.map((row) => ({
              id: row.id,
              description: row.description,
              amount: row.amount,
              status: row.status,
              paymentMethod: row.paymentMethod,
              transactionDate: row.transactionDate,
              categoryId: row.categoryId,
              categoryName: row.categoryName,
              notes: row.notes,
              fixedIncomeId: row.fixedIncomeId,
            }))}
          />
        </section>

        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Rendas fixas
            </h2>
            <CreatePlanButton
              label="Nova renda fixa"
              title="Nova renda fixa"
              description="Valor que se repete todo mês e entra em Ganhos."
              categories={incomeCategories}
              cards={[]}
              categoryType="income"
              upsertAction={upsertFixedIncomeAction}
              showCard={false}
              defaultPayment="pix"
            />
          </div>
          <RecurrentPlansGrid
            items={fixedIncomes}
            categories={incomeCategories}
            cards={[]}
            emptyLabel="Nenhuma renda fixa cadastrada."
            singularLabel="renda fixa"
            categoryType="income"
            upsertAction={upsertFixedIncomeAction}
            deactivateAction={deactivateFixedIncomeAction}
            deleteAction={deleteFixedIncomeAction}
            showCard={false}
            amountClassName="text-emerald-400"
          />
        </section>
      </main>
    </>
  );
}
