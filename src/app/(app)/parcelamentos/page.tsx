import { listCategories, listInstallmentPlans } from "@/src/actions/finance/queries";
import { listCreditCards } from "@/src/actions/finance/credit-cards";
import { PageHeader } from "@/src/components/global/page-header";
import { InstallmentPlansGrid } from "@/src/app/(app)/parcelamentos/_components/installment-plans-ui";
import { InstallmentFormDialog } from "@/src/app/(app)/parcelamentos/_components/installment-form";

type ParcelamentosPageProps = {
  searchParams: Promise<{ novo?: string }>;
};

export default async function ParcelamentosPage({
  searchParams,
}: ParcelamentosPageProps) {
  const params = await searchParams;
  const [plans, categories, cards] = await Promise.all([
    listInstallmentPlans(),
    listCategories(),
    listCreditCards(),
  ]);
  const activeCount = plans.filter((plan) => plan.status === "active").length;
  const expenseCategories = categories
    .filter((category) => category.type === "expense")
    .map((category) => ({ id: category.id, name: category.name }));
  const activeCards = cards
    .filter((card) => card.status === "active")
    .map((card) => ({ id: card.id, name: card.name }));

  return (
    <>
      <PageHeader
        title="Parcelamentos"
        subtitle="Compras parceladas e o saldo de cada uma"
        backHref="/"
        backLabel="Início"
      />

      <main className="page-container space-y-8 pb-20 sm:pb-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {plans.length}{" "}
            {plans.length === 1 ? "parcelamento" : "parcelamentos"}
            {activeCount > 0 && (
              <span>
                {" "}
                · {activeCount} em andamento
              </span>
            )}
          </p>
          <InstallmentFormDialog
            key={params.novo === "1" ? "novo" : "lista"}
            categories={expenseCategories}
            cards={activeCards}
            defaultOpen={params.novo === "1"}
          />
        </div>

        <InstallmentPlansGrid plans={plans} />
      </main>
    </>
  );
}
