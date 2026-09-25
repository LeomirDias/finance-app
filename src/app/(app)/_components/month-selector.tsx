"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  formatMonthLabel,
  formatYearMonth,
  shiftYearMonth,
} from "@/src/lib/finance/dates";

type MonthSelectorProps = {
  year: number;
  month: number;
  basePath?: string;
};

export function MonthSelector({
  year,
  month,
  basePath = "/",
}: MonthSelectorProps) {
  const prev = shiftYearMonth(year, month, -1);
  const next = shiftYearMonth(year, month, 1);

  const hrefFor = (y: number, m: number) =>
    `${basePath}?month=${formatYearMonth(y, m)}`;

  return (
    <div className="sticky top-0 z-10 -mx-4 mb-6 border-b border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:mb-8 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
      <div className="flex items-center justify-between gap-3 sm:justify-start sm:gap-4">
        <Link
          href={hrefFor(prev.year, prev.month)}
          className="inline-flex size-11 items-center justify-center rounded-xl border border-border/60 text-foreground transition-colors hover:border-primary/40 hover:text-primary-light"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="size-5" />
        </Link>

        <h2 className="min-w-0 flex-1 text-center text-lg font-semibold tracking-tight text-primary-light sm:flex-none sm:text-left sm:text-xl">
          {formatMonthLabel(year, month)}
        </h2>

        <Link
          href={hrefFor(next.year, next.month)}
          className="inline-flex size-11 items-center justify-center rounded-xl border border-border/60 text-foreground transition-colors hover:border-primary/40 hover:text-primary-light"
          aria-label="Próximo mês"
        >
          <ChevronRight className="size-5" />
        </Link>
      </div>
    </div>
  );
}
