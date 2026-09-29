import type { Metadata } from "next";

import { PageHeader } from "@/src/components/global/page-header";

export const metadata: Metadata = {
  title: "Cartões",
};
import { listCreditCards } from "@/src/actions/finance/credit-cards";
import {
  CreditCardList,
  NewCreditCardDialog,
} from "@/src/app/(app)/cartoes/_components/credit-card-ui";

export default async function CartoesPage() {
  const cards = await listCreditCards();

  return (
    <>
      <PageHeader
        title="Cartões"
        subtitle="Cadastro simples para vincular gastos e parcelas"
        backHref="/"
        backLabel="Início"
      />

      <main className="page-container space-y-8 pb-20 sm:pb-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {cards.length} {cards.length === 1 ? "cartão" : "cartões"}
          </p>
          <NewCreditCardDialog />
        </div>

        <CreditCardList
          cards={cards.map((c) => ({
            id: c.id,
            name: c.name,
            institution: c.institution,
            dueDay: c.dueDay,
            status: c.status,
          }))}
        />
      </main>
    </>
  );
}
