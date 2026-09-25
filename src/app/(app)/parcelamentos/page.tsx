import Link from "next/link";
import { Plus } from "lucide-react";

import { listInstallmentPlans } from "@/src/actions/finance/queries";
import { PageHeader } from "@/src/components/global/page-header";
import { buttonVariants } from "@/src/components/ui/button";
import { InstallmentPlansGrid } from "@/src/app/(app)/parcelamentos/_components/installment-plans-ui";
import { cn } from "@/src/lib/utils";

export default async function ParcelamentosPage() {
  const plans = await listInstallmentPlans();
  const activeCount = plans.filter((p) => p.status === "active").length;

  return (
    <>
      <PageHeader
        title="Parcelamentos"
        subtitle="Acompanhe o progresso e o saldo restante de cada compra parcelada"
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
                · {activeCount}{" "}
                {activeCount === 1 ? "em andamento" : "em andamento"}
              </span>
            )}
          </p>
          <Link
            href="/lancamentos?novo=installment"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-11 gap-2 rounded-xl font-semibold sm:h-12",
            )}
          >
            <Plus className="size-4" />
            Novo parcelamento
          </Link>
        </div>

        <InstallmentPlansGrid plans={plans} />
      </main>
    </>
  );
}
