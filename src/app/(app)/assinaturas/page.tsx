import Link from "next/link";
import { Plus } from "lucide-react";

import {
  listCategories,
  listRecurrentSummaries,
} from "@/src/actions/finance/queries";
import { listCreditCards } from "@/src/actions/finance/credit-cards";
import { PageHeader } from "@/src/components/global/page-header";
import { buttonVariants } from "@/src/components/ui/button";
import { RecurrentPlansGrid } from "@/src/app/(app)/_components/recurrent-plans-ui";
import { cn } from "@/src/lib/utils";

export default async function AssinaturasPage() {
  const [items, categories, cards] = await Promise.all([
    listRecurrentSummaries({ kind: "subscription" }),
    listCategories(),
    listCreditCards(),
  ]);

  const activeCount = items.filter((i) => i.status === "active").length;
  const categoryOptions = categories
    .filter((c) => c.type === "expense")
    .map((c) => ({ id: c.id, name: c.name, type: c.type }));
  const activeCards = cards
    .filter((c) => c.status === "active")
    .map((c) => ({ id: c.id, name: c.name }));

  return (
    <>
      <PageHeader
        title="Assinaturas"
        subtitle="Acompanhe serviços e cobranças mensais recorrentes"
        backHref="/"
        backLabel="Início"
      />

      <main className="page-container space-y-8 pb-20 sm:pb-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {items.length}{" "}
            {items.length === 1 ? "assinatura" : "assinaturas"}
            {activeCount > 0 && (
              <span>
                {" "}
                · {activeCount} {activeCount === 1 ? "ativa" : "ativas"}
              </span>
            )}
          </p>
          <Link
            href="/lancamentos?novo=subscription"
            className={cn(
              buttonVariants({ variant: "default" }),
              "h-11 gap-2 rounded-xl font-semibold sm:h-12",
            )}
          >
            <Plus className="size-4" />
            Nova assinatura
          </Link>
        </div>

        <RecurrentPlansGrid
          items={items}
          kind="subscription"
          categories={categoryOptions}
          cards={activeCards}
          emptyLabel="Nenhuma assinatura cadastrada. Crie uma em Nova assinatura."
          singularLabel="assinatura"
        />
      </main>
    </>
  );
}
