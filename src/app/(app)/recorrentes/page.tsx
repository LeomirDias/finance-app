import {
  listCategories,
  listPlanSummaries,
} from "@/src/actions/finance/queries";
import { listCreditCards } from "@/src/actions/finance/credit-cards";
import { PageHeader } from "@/src/components/global/page-header";
import {
  CreatePlanButton,
  RecurrentPlansGrid,
} from "@/src/app/(app)/_components/recurrent-plans-ui";
import {
  deactivateRecurringExpenseAction,
  deleteRecurringExpenseAction,
  upsertRecurringExpenseAction,
} from "@/src/actions/finance/plans";

type RecorrentesPageProps = {
  searchParams: Promise<{ novo?: string }>;
};

export default async function RecorrentesPage({
  searchParams,
}: RecorrentesPageProps) {
  const params = await searchParams;
  const [items, categories, cards] = await Promise.all([
    listPlanSummaries("recurring_expense"),
    listCategories(),
    listCreditCards(),
  ]);

  const activeCount = items.filter((item) => item.status === "active").length;
  const categoryOptions = categories
    .filter((category) => category.type === "expense")
    .map((category) => ({
      id: category.id,
      name: category.name,
      type: category.type,
    }));
  const activeCards = cards
    .filter((card) => card.status === "active")
    .map((card) => ({ id: card.id, name: card.name }));

  return (
    <>
      <PageHeader
        title="Recorrentes"
        subtitle="Pagamentos fixos mensais, separados de assinaturas e gastos avulsos"
        backHref="/"
        backLabel="Início"
      />

      <main className="page-container space-y-8 pb-20 sm:pb-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "recorrente" : "recorrentes"}
            {activeCount > 0 && (
              <span>
                {" "}
                · {activeCount} {activeCount === 1 ? "ativo" : "ativos"}
              </span>
            )}
          </p>
          <CreatePlanButton
            key={params.novo === "1" ? "novo" : "lista"}
            label="Novo recorrente"
            title="Novo recorrente"
            description="Conta fixa que se repete todo mês, como aluguel ou condomínio."
            categories={categoryOptions}
            cards={activeCards}
            categoryType="expense"
            upsertAction={upsertRecurringExpenseAction}
            defaultOpen={params.novo === "1"}
            returnPath="/recorrentes"
          />
        </div>

        <RecurrentPlansGrid
          items={items}
          categories={categoryOptions}
          cards={activeCards}
          emptyLabel="Nenhum pagamento recorrente cadastrado."
          singularLabel="recorrência"
          categoryType="expense"
          upsertAction={upsertRecurringExpenseAction}
          deactivateAction={deactivateRecurringExpenseAction}
          deleteAction={deleteRecurringExpenseAction}
        />
      </main>
    </>
  );
}
