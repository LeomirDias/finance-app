"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

import {
  FiltersToggleButton,
  TransactionFilters,
} from "@/src/app/(app)/_components/ledger-filters";

type CardOption = { id: string; name: string };

export function LedgerToolbar({
  filterCategories,
  cards,
  count,
  countLabel,
  basePath,
  mode,
  defaultFrom,
  defaultTo,
  action,
}: {
  filterCategories: { id: string; name: string }[];
  cards: CardOption[];
  count: number;
  countLabel: { singular: string; plural: string };
  basePath: string;
  mode: "income" | "expense";
  defaultFrom: string;
  defaultTo: string;
  action: ReactNode;
}) {
  const searchParams = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = useMemo(() => {
    const keys = ["q", "from", "to", "card", "category", "payment"] as const;
    return keys.filter((key) => {
      const value = searchParams.get(key);
      return value != null && value.length > 0;
    }).length;
  }, [searchParams]);

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {count} {count === 1 ? countLabel.singular : countLabel.plural}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <FiltersToggleButton
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            activeCount={activeFilterCount}
          />
          {action}
        </div>
      </div>

      <TransactionFilters
        categories={filterCategories}
        cards={cards}
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        basePath={basePath}
        mode={mode}
        defaultFrom={defaultFrom}
        defaultTo={defaultTo}
      />
    </>
  );
}
