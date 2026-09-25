import Link from "next/link";
import { Plus } from "lucide-react";

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
    <main className="page-container relative pb-24 sm:pb-10">
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

      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Lançamentos do mês
        </h2>
        <Link
          href="/lancamentos"
          className="text-xs font-medium text-primary-light transition-opacity hover:opacity-80"
        >
          Ver todos
        </Link>
      </div>

      <MonthTransactionList groups={overview.groups} />

      <Link
        href="/lancamentos?novo=1"
        className="fixed bottom-5 right-5 z-20 inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-opacity hover:opacity-90 sm:bottom-8 sm:right-8"
        aria-label="Novo lançamento"
      >
        <Plus className="size-6" />
      </Link>
    </main>
  );
}
