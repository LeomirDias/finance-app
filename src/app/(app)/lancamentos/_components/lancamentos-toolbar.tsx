"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { EntryFormDialog } from "@/src/app/(app)/lancamentos/_components/entry-form";
import {
  FiltersToggleButton,
  TransactionFilters,
} from "@/src/app/(app)/lancamentos/_components/transaction-filters";

type CategoryOption = {
  id: string;
  name: string;
  type: "income" | "expense";
};

type CardOption = { id: string; name: string };

type LancamentosToolbarProps = {
  categories: CategoryOption[];
  filterCategories: { id: string; name: string }[];
  cards: CardOption[];
  activeCards: CardOption[];
  defaultOpenForm?: boolean;
  transactionCount: number;
};

export function LancamentosToolbar({
  categories,
  filterCategories,
  cards,
  activeCards,
  defaultOpenForm = false,
  transactionCount,
}: LancamentosToolbarProps) {
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
          {transactionCount}{" "}
          {transactionCount === 1 ? "lançamento" : "lançamentos"}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <FiltersToggleButton
            open={filtersOpen}
            onOpenChange={setFiltersOpen}
            activeCount={activeFilterCount}
          />
          <EntryFormDialog
            categories={categories}
            cards={activeCards}
            defaultOpen={defaultOpenForm}
          />
        </div>
      </div>

      <TransactionFilters
        categories={filterCategories}
        cards={cards}
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
      />
    </>
  );
}
