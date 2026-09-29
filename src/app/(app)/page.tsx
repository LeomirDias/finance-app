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
import { MonthTransactionList } from "@/src/app/(app)/_components/month-transaction-list";

type HomePageProps = {
  searchParams: Promise<{ month?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const yearMonth = await resolveMonthParam(params);
  const overview = await getMonthOverviewAction(yearMonth);

  return (
    <main className="page-container relative pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:pb-10">
      <MonthSelector year={overview.year} month={overview.month} />

      <MonthKpis
        plannedIncome={overview.plannedIncome}
        plannedExpense={overview.plannedExpense}
        plannedBalance={overview.plannedBalance}
        realizedIncome={overview.realizedIncome}
        realizedExpense={overview.realizedExpense}
        realizedBalance={overview.realizedBalance}
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
        pendingCount={overview.pendingCount}
        paidCount={overview.paidCount}
        avgDailyExpense={overview.avgDailyExpense}
        realizedExpense={overview.realizedExpense}
        plannedExpense={overview.plannedExpense}
      />

      <div className="mb-3 flex items-end justify-between gap-3 sm:mb-4 sm:gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Movimentações
        </h2>
        <div className="flex items-center gap-3">
          <Link
            href="/ganhos"
            className="text-xs font-medium text-emerald-400 transition-opacity hover:opacity-80"
          >
            Ganhos
          </Link>
          <Link
            href="/gastos"
            className="text-xs font-medium text-primary-light transition-opacity hover:opacity-80"
          >
            Gastos
          </Link>
        </div>
      </div>

      <MonthTransactionList groups={overview.groups} />

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
