import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Início",
};

import { getMonthOverviewAction } from "@/src/actions/finance/queries";
import { resolveMonthParam } from "@/src/actions/finance/queries";
import { MonthSelector } from "@/src/app/(app)/_components/month-selector";
import { MonthKpis } from "@/src/app/(app)/_components/month-kpis";
import { MonthAnalytics } from "@/src/app/(app)/_components/month-analytics";

type HomePageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const yearMonth = await resolveMonthParam(params);
  const overview = await getMonthOverviewAction(yearMonth);

  return (
    <main className="page-container relative">
      <MonthSelector year={overview.year} month={overview.month} />

      <MonthKpis
        plannedIncome={overview.plannedIncome}
        plannedExpense={overview.plannedExpense}
        plannedBalance={overview.plannedBalance}
        realizedIncome={overview.realizedIncome}
        realizedExpense={overview.realizedExpense}
        realizedBalance={overview.realizedBalance}
        fixedExpense={overview.fixedExpense}
        variableExpense={overview.variableExpense}
      />

      <MonthAnalytics
        year={overview.year}
        month={overview.month}
        byCategory={overview.byCategory}
        byCard={overview.byCard}
        byPaymentMethod={overview.byPaymentMethod}
        byDay={overview.byDay}
        byWeekday={overview.byWeekday}
        peakDays={overview.peakDays}
        byNature={overview.byNature}
        topExpenses={overview.topExpenses}
      />

      <Link
        href="/gastos?novo=1"
        className="fixed right-8 bottom-8 z-20 hidden size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-opacity hover:opacity-90 md:inline-flex"
        aria-label="Novo gasto"
      >
        <Plus className="size-6" />
      </Link>
    </main>
  );
}
