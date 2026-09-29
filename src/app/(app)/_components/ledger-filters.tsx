"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useTransition } from "react";
import { Filter, Search, X } from "lucide-react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { cn } from "@/src/lib/utils";

type Option = { id: string; name: string };

const PAYMENT_METHODS = [
  { value: "pix", label: "Pix" },
  { value: "credit_card", label: "Cartão de crédito" },
  { value: "debit_card", label: "Cartão de débito" },
  { value: "bank_transfer", label: "Transferência" },
  { value: "cash", label: "Dinheiro" },
] as const;

const selectClass =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

type TransactionFiltersProps = {
  categories: Option[];
  cards: Option[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  basePath?: string;
  mode?: "expense" | "income";
  defaultFrom: string;
  defaultTo: string;
};

export function TransactionFilters({
  categories,
  cards,
  open,
  onOpenChange,
  basePath = "/gastos",
  mode = "expense",
  defaultFrom,
  defaultTo,
}: TransactionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const current = {
    q: searchParams.get("q") ?? "",
    from: searchParams.get("from") ?? defaultFrom,
    to: searchParams.get("to") ?? defaultTo,
    card: searchParams.get("card") ?? "",
    category: searchParams.get("category") ?? "",
    payment: searchParams.get("payment") ?? "",
  };

  const hasCustomFilters =
    (searchParams.get("q") ?? "").length > 0 ||
    (searchParams.get("from") ?? "").length > 0 ||
    (searchParams.get("to") ?? "").length > 0 ||
    (searchParams.get("card") ?? "").length > 0 ||
    (searchParams.get("category") ?? "").length > 0 ||
    (searchParams.get("payment") ?? "").length > 0;

  const filterHint = "Por padrão mostra o mês atual";
  const formKey =
    searchParams.toString() || `month-${defaultFrom}-${defaultTo}`;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const apply = useCallback(
    (formData: FormData) => {
      const params = new URLSearchParams();
      const keys = ["q", "from", "to", "card", "category", "payment"] as const;

      for (const key of keys) {
        const value = String(formData.get(key) ?? "").trim();
        if (value) params.set(key, value);
      }

      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `${basePath}?${qs}` : basePath);
        onOpenChange(false);
      });
    },
    [router, onOpenChange, basePath],
  );

  function clear() {
    startTransition(() => {
      router.push(basePath);
      onOpenChange(false);
    });
  }

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Fechar filtros"
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => onOpenChange(false)}
        />
      )}

      <aside
        id="filters-sidebar"
        className={cn(
          "fixed top-0 right-0 z-50 flex h-dvh max-h-dvh w-full max-w-sm flex-col border-l border-border bg-background shadow-xl transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border/60 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Filtros</h2>
            <p className="text-xs text-muted-foreground">{filterHint}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => onOpenChange(false)}
            aria-label="Fechar painel de filtros"
          >
            <X className="size-4" />
          </Button>
        </div>

        <form
          key={formKey}
          action={apply}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={current.q}
                placeholder="Buscar por descrição"
                className="h-11 rounded-xl pl-10 text-base"
              />
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="from" className="text-xs text-muted-foreground">
                  De
                </Label>
                <Input
                  id="from"
                  name="from"
                  type="date"
                  defaultValue={current.from}
                  className="h-11 rounded-xl text-base"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="to" className="text-xs text-muted-foreground">
                  Até
                </Label>
                <Input
                  id="to"
                  name="to"
                  type="date"
                  defaultValue={current.to}
                  className="h-11 rounded-xl text-base"
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="category"
                  className="text-xs text-muted-foreground"
                >
                  Categoria
                </Label>
                <select
                  id="category"
                  name="category"
                  defaultValue={current.category}
                  className={selectClass}
                >
                  <option value="">Todas</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="card" className="text-xs text-muted-foreground">
                  Cartão
                </Label>
                <select
                  id="card"
                  name="card"
                  defaultValue={current.card}
                  className={selectClass}
                >
                  <option value="">Todos</option>
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="payment"
                  className="text-xs text-muted-foreground"
                >
                  Tipo de pagamento
                </Label>
                <select
                  id="payment"
                  name="payment"
                  defaultValue={current.payment}
                  className={selectClass}
                >
                  <option value="">Todos</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 border-t border-border/60 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <Button
              type="submit"
              disabled={isPending}
              className="h-11 w-full rounded-xl font-semibold"
            >
              {isPending ? "Filtrando..." : "Aplicar filtros"}
            </Button>
            {hasCustomFilters && (
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={clear}
                className="h-11 w-full rounded-xl"
              >
                <X className="size-4" />
                Voltar ao mês atual
              </Button>
            )}
          </div>
        </form>
      </aside>
    </>
  );
}

export function FiltersToggleButton({
  open,
  onOpenChange,
  activeCount = 0,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeCount?: number;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => onOpenChange(!open)}
      className="h-11 gap-2 rounded-xl"
      aria-expanded={open}
      aria-controls="filters-sidebar"
    >
      <Filter className="size-4" />
      Filtros
      {activeCount > 0 && (
        <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
          {activeCount}
        </span>
      )}
    </Button>
  );
}
