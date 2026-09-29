import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import {
  getCreditCardStatement,
  parseCardStatementFilters,
} from "@/src/actions/finance/card-statement";
import { CardStatementView } from "@/src/app/(app)/cartoes/_components/card-statement-ui";
import { PageHeader } from "@/src/components/global/page-header";
import { formatMonthLabel } from "@/src/lib/finance/dates";

type CartaoFaturaPageProps = {
  params: Promise<{ cardId: string }>;
  searchParams: Promise<{
    mes?: string;
    periodo?: string;
    q?: string;
    tipo?: string;
    situacao?: string;
    categoria?: string;
  }>;
};

export async function generateMetadata({
  params,
}: CartaoFaturaPageProps): Promise<Metadata> {
  const { cardId } = await params;
  const statement = await getCreditCardStatement(
    cardId,
    parseCardStatementFilters({}),
  );

  if (!statement) {
    return { title: "Cartão" };
  }

  return {
    title: `${statement.card.name} · Fatura`,
  };
}

export default async function CartaoFaturaPage({
  params,
  searchParams,
}: CartaoFaturaPageProps) {
  const { cardId } = await params;
  const rawParams = await searchParams;
  const filters = parseCardStatementFilters(rawParams);
  const statement = await getCreditCardStatement(cardId, filters);

  if (!statement) {
    notFound();
  }

  const periodLabel = statement.allTime
    ? "Todo o histórico"
    : formatMonthLabel(statement.year, statement.monthNumber);

  return (
    <>
      <PageHeader
        title={statement.card.name}
        subtitle={
          statement.card.institution
            ? `${statement.card.institution} · ${periodLabel}`
            : periodLabel
        }
        backHref="/cartoes"
        backLabel="Cartões"
      />

      <main className="page-container space-y-6 pb-20 sm:space-y-8 sm:pb-10">
        <Suspense fallback={null}>
          <CardStatementView statement={statement} />
        </Suspense>
      </main>
    </>
  );
}
