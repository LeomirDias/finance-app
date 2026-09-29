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
  deactivateSubscriptionAction,
  deleteSubscriptionAction,
  upsertSubscriptionAction,
} from "@/src/actions/finance/plans";

type AssinaturasPageProps = {
  searchParams: Promise<{ novo?: string }>;
};

export default async function AssinaturasPage({
  searchParams,
}: AssinaturasPageProps) {
  const params = await searchParams;
  const [items, categories, cards] = await Promise.all([
    listPlanSummaries("subscription"),
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
        title="Assinaturas"
        subtitle="Serviços com cobrança mensal, separados dos gastos avulsos"
        backHref="/"
        backLabel="Início"
      />

      <main className="page-container space-y-8 pb-20 sm:pb-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "assinatura" : "assinaturas"}
            {activeCount > 0 && (
              <span>
                {" "}
                · {activeCount} {activeCount === 1 ? "ativa" : "ativas"}
              </span>
            )}
          </p>
          <CreatePlanButton
            key={params.novo === "1" ? "novo" : "lista"}
            label="Nova assinatura"
            title="Nova assinatura"
            description="A cobrança do mês aparece no início e nesta tela."
            categories={categoryOptions}
            cards={activeCards}
            categoryType="expense"
            upsertAction={upsertSubscriptionAction}
            defaultOpen={params.novo === "1"}
            returnPath="/assinaturas"
          />
        </div>

        <RecurrentPlansGrid
          items={items}
          categories={categoryOptions}
          cards={activeCards}
          emptyLabel="Nenhuma assinatura cadastrada."
          singularLabel="assinatura"
          categoryType="expense"
          upsertAction={upsertSubscriptionAction}
          deactivateAction={deactivateSubscriptionAction}
          deleteAction={deleteSubscriptionAction}
        />
      </main>
    </>
  );
}
