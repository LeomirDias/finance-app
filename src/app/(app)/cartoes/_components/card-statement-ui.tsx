"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingBag,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";

import { toggleLedgerStatusAction } from "@/src/actions/finance/toggle-status";
import {
  STATEMENT_KINDS,
  type CardStatement,
  type CardStatementItem,
  type CardStatementKind,
} from "@/src/lib/finance/card-statement-types";
import { Button } from "@/src/components/ui/button";
import { FormSelect } from "@/src/components/ui/form-select";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  formatCalendarDate,
  formatMonthLabel,
  shiftYearMonth,
} from "@/src/lib/finance/dates";
import { formatCurrency } from "@/src/lib/helpers/format";
import { cn } from "@/src/lib/utils";

const KIND_ICONS: Record<CardStatementKind, LucideIcon> = {
  expense: ShoppingBag,
  subscription: Sparkles,
  recurring: RefreshCw,
  installment: Layers,
};

const PHASE_LABELS: Record<CardStatement["phase"], string> = {
  open: "Fatura aberta",
  due_today: "Vence hoje",
  overdue: "Vencida",
  paid: "Quitada",
  empty: "Sem lançamentos",
  all: "Histórico completo",
};

const PHASE_STYLES: Record<CardStatement["phase"], string> = {
  open: "bg-white/15 text-white",
  due_today: "bg-amber-400/25 text-amber-100",
  overdue: "bg-red-500/25 text-red-100",
  paid: "bg-emerald-400/20 text-emerald-100",
  empty: "bg-white/10 text-white/80",
  all: "bg-white/10 text-white/80",
};

function statusLabel(status: CardStatement["items"][number]["status"]) {
  if (status === "pending") return "Pendente";
  if (status === "paid" || status === "received") return "Pago";
  return status;
}

function statusStyle(status: CardStatement["items"][number]["status"]) {
  if (status === "pending") {
    return "bg-amber-500/15 text-amber-400";
  }
  if (status === "paid" || status === "received") {
    return "bg-emerald-500/15 text-emerald-400";
  }
  return "bg-muted text-muted-foreground";
}

function kindLabel(kind: CardStatementKind) {
  return STATEMENT_KINDS.find((entry) => entry.id === kind)?.itemLabel ?? kind;
}

function serializeParams(
  base: URLSearchParams,
  updates: Record<string, string | null>,
) {
  const next = new URLSearchParams(base.toString());
  for (const [key, value] of Object.entries(updates)) {
    if (value == null || value.length === 0) next.delete(key);
    else next.set(key, value);
  }
  return next;
}

export function CardStatementView({ statement }: { statement: CardStatement }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isToggling, startToggleTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const monthLabel = statement.allTime
    ? "Todo o histórico"
    : formatMonthLabel(statement.year, statement.monthNumber);

  const activeFilterCount = useMemo(() => {
    const keys = ["q", "tipo", "situacao", "categoria", "periodo"] as const;
    return keys.filter((key) => {
      const value = searchParams.get(key);
      return value != null && value.length > 0;
    }).length;
  }, [searchParams]);

  const pushParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = serializeParams(searchParams, updates);
      const qs = next.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [pathname, router, searchParams],
  );

  function shiftMonth(delta: number) {
    const { year, month } = shiftYearMonth(
      statement.year,
      statement.monthNumber,
      delta,
    );
    const mes = `${year}-${String(month).padStart(2, "0")}`;
    pushParams({ mes, periodo: null });
  }

  const filterDefaults = {
    q: searchParams.get("q") ?? "",
    tipo: searchParams.get("tipo") ?? "",
    situacao: searchParams.get("situacao") ?? "",
    categoria: searchParams.get("categoria") ?? "",
    periodo: searchParams.get("periodo") ?? "",
  };

  function toggleItem(item: CardStatementItem) {
    if (item.status === "canceled") return;

    const isDone = item.status === "paid" || item.status === "received";
    const nextStatus = isDone ? "pending" : "paid";

    const formData = new FormData();
    formData.set("id", item.entryId);
    formData.set("source", item.source);
    formData.set("status", nextStatus);

    startToggleTransition(async () => {
      await toggleLedgerStatusAction({}, formData);
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "space-y-6",
        (isPending || isToggling) && "opacity-70 transition-opacity",
      )}
    >
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#5b0a91] via-primary to-[#9d4edd] p-6 text-white shadow-lg shadow-primary/20 sm:p-8">
        <div className="pointer-events-none absolute -right-8 -top-8 size-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-10 left-1/3 size-32 rounded-full bg-white/5 blur-xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                  PHASE_STYLES[statement.phase],
                )}
              >
                {PHASE_LABELS[statement.phase]}
              </span>
              {statement.card.dueDay && !statement.allTime && (
                <span className="text-xs text-white/75">
                  Vencimento{" "}
                  {statement.dueDate
                    ? formatCalendarDate(statement.dueDate, {
                      day: "2-digit",
                      month: "long",
                    })
                    : `dia ${statement.card.dueDay}`}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-white/80">
                {statement.allTime ? "Total no cartão" : "Fatura do mês"}
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                {formatCurrency(statement.invoice.amount)}
              </p>
            </div>
            {!statement.allTime && (
              <div className="flex flex-wrap gap-4 text-sm text-white/85">
                <span>
                  Pendente{" "}
                  <strong className="font-semibold text-white">
                    {formatCurrency(statement.invoice.pending)}
                  </strong>
                </span>
                <span>
                  Pago{" "}
                  <strong className="font-semibold text-white">
                    {formatCurrency(statement.invoice.paid)}
                  </strong>
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {STATEMENT_KINDS.map((entry) => {
              const stats = statement.invoice.byKind[entry.id];
              if (stats.count === 0) return null;
              return (
                <div
                  key={entry.id}
                  className="rounded-2xl bg-black/15 px-3 py-2 text-xs backdrop-blur-sm"
                >
                  <p className="font-medium text-white/90">{entry.label}</p>
                  <p className="mt-0.5 font-semibold text-white">
                    {formatCurrency(stats.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {!statement.allTime && (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-10 rounded-xl"
                onClick={() => shiftMonth(-1)}
                aria-label="Mês anterior"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-36 text-center text-sm font-semibold capitalize">
                {monthLabel}
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-10 rounded-xl"
                onClick={() => shiftMonth(1)}
                aria-label="Próximo mês"
              >
                <ChevronRight className="size-4" />
              </Button>
            </>
          )}
          {statement.allTime && (
            <span className="text-sm font-semibold text-muted-foreground">
              {monthLabel}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={statement.allTime ? "default" : "outline"}
            className="h-10 rounded-xl text-sm"
            onClick={() =>
              pushParams({ periodo: statement.allTime ? null : "tudo", mes: null })
            }
          >
            {statement.allTime ? "Ver por mês" : "Ver tudo"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-2 rounded-xl"
            onClick={() => setFiltersOpen(true)}
          >
            <Filter className="size-4" />
            Filtros
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary-light">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      <CardStatementFilters
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        categories={statement.categories}
        defaults={filterDefaults}
        onApply={(formData) => {
          const updates: Record<string, string | null> = {
            q: String(formData.get("q") ?? "").trim() || null,
            tipo: String(formData.get("tipo") ?? "").trim() || null,
            situacao: String(formData.get("situacao") ?? "").trim() || null,
            categoria: String(formData.get("categoria") ?? "").trim() || null,
          };
          pushParams(updates);
          setFiltersOpen(false);
        }}
        onClear={() => {
          pushParams({
            q: null,
            tipo: null,
            situacao: null,
            categoria: null,
          });
          setFiltersOpen(false);
        }}
      />

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Lançamentos
          </h2>
          <p className="text-xs text-muted-foreground">
            {statement.visible.count}{" "}
            {statement.visible.count === 1 ? "item" : "itens"}
            {activeFilterCount > 0 && (
              <span> · {formatCurrency(statement.visible.amount)}</span>
            )}
          </p>
        </div>

        {statement.items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 px-6 py-12 text-center">
            <p className="text-sm font-medium text-foreground">
              Nenhum lançamento neste período
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ajuste os filtros ou escolha outro mês para ver gastos, assinaturas,
              recorrências e compras parceladas.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-card/40">
            {statement.items.map((item) => {
              const Icon = KIND_ICONS[item.kind];
              const isDone =
                item.status === "paid" || item.status === "received";
              const canToggle = item.status !== "canceled";

              return (
                <li
                  key={item.id}
                  className="flex items-start gap-3 px-4 py-4 sm:gap-4 sm:px-5"
                >
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary-light">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "truncate font-medium",
                            isDone && "text-muted-foreground line-through",
                          )}
                        >
                          {item.description}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatCalendarDate(item.occurredAt)}
                          {item.categoryName && (
                            <span> · {item.categoryName}</span>
                          )}
                        </p>
                      </div>
                      <p className="shrink-0 text-base font-semibold tabular-nums">
                        {formatCurrency(item.amount)}
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {kindLabel(item.kind)}
                        {item.installmentNumber != null &&
                          item.totalInstallments != null && (
                            <span>
                              {" "}
                              · {item.installmentNumber}/{item.totalInstallments}
                            </span>
                          )}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium",
                          statusStyle(item.status),
                        )}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </div>
                  </div>
                  {canToggle && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isToggling}
                      onClick={() => toggleItem(item)}
                      className="size-10 shrink-0 rounded-xl"
                      aria-label={
                        isDone ? "Marcar como pendente" : "Marcar como pago"
                      }
                    >
                      {isDone ? (
                        <RotateCcw className="size-4" />
                      ) : (
                        <Check className="size-4" />
                      )}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function CardStatementFilters({
  open,
  onOpenChange,
  categories,
  defaults,
  onApply,
  onClear,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: { id: string; name: string }[];
  defaults: {
    q: string;
    tipo: string;
    situacao: string;
    categoria: string;
    periodo: string;
  };
  onApply: (formData: FormData) => void;
  onClear: () => void;
}) {
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

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Fechar filtros"
        className="fixed inset-0 z-40 bg-black/40"
        onClick={() => onOpenChange(false)}
      />
      <aside className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-3xl border border-border/60 bg-background p-5 shadow-2xl sm:inset-x-auto sm:left-1/2 sm:top-1/2 sm:max-h-[90vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold">Filtrar fatura</h3>
            <p className="text-sm text-muted-foreground">
              Refine por tipo, situação ou categoria
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onApply(new FormData(event.currentTarget));
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="stmt-q">Buscar</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="stmt-q"
                name="q"
                defaultValue={defaults.q}
                placeholder="Descrição do lançamento"
                className="h-11 rounded-xl pl-9"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="stmt-tipo">Tipo</Label>
              <FormSelect
                id="stmt-tipo"
                name="tipo"
                defaultValue={defaults.tipo}
                options={[
                  { value: "", label: "Todos os tipos" },
                  ...STATEMENT_KINDS.map((entry) => ({
                    value: entry.param,
                    label: entry.label,
                  })),
                ]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stmt-situacao">Situação</Label>
              <FormSelect
                id="stmt-situacao"
                name="situacao"
                defaultValue={defaults.situacao}
                options={[
                  { value: "", label: "Todas" },
                  { value: "pendente", label: "Pendentes" },
                  { value: "pago", label: "Pagos" },
                ]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stmt-categoria">Categoria</Label>
            <FormSelect
              id="stmt-categoria"
              name="categoria"
              defaultValue={defaults.categoria}
              options={[
                { value: "", label: "Todas as categorias" },
                ...categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                })),
              ]}
            />
          </div>

          <div className="flex flex-col gap-2 pt-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl sm:flex-1"
              onClick={onClear}
            >
              Limpar
            </Button>
            <Button type="submit" className="h-11 rounded-xl font-semibold sm:flex-1">
              Aplicar filtros
            </Button>
          </div>
        </form>
      </aside>
    </>
  );
}
