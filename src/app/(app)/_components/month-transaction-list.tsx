"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, RotateCcw } from "lucide-react";

import { toggleTransactionStatusAction } from "@/src/actions/finance/upsert-transaction";
import type { MonthTransaction } from "@/src/lib/finance/month-summary";
import { formatCurrency } from "@/src/lib/helpers/format";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

const GROUP_LABELS: Record<MonthTransaction["group"], string> = {
  income: "Ganhos",
  subscription: "Assinaturas",
  recurring: "Recorrentes",
  installment: "Parcelas",
  one_off: "Avulsos",
};

const GROUP_ORDER: MonthTransaction["group"][] = [
  "income",
  "subscription",
  "recurring",
  "installment",
  "one_off",
];

type MonthTransactionListProps = {
  groups: Record<MonthTransaction["group"], MonthTransaction[]>;
};

function formatDay(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function statusLabel(tx: MonthTransaction) {
  if (tx.status === "pending") return "Pendente";
  if (tx.status === "paid") return "Pago";
  if (tx.status === "received") return "Recebido";
  return "Cancelado";
}

function TransactionMeta({ tx }: { tx: MonthTransaction }) {
  const parts = [
    tx.categoryName,
    tx.creditCardName,
    tx.installmentNumber ? `Parcela ${tx.installmentNumber}` : null,
  ].filter(Boolean);

  if (parts.length === 0) return null;

  return (
    <p className="mt-0.5 truncate text-xs text-muted-foreground">
      {parts.join(" · ")}
    </p>
  );
}

export function MonthTransactionList({ groups }: MonthTransactionListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle(tx: MonthTransaction) {
    const nextStatus =
      tx.type === "income"
        ? tx.status === "received"
          ? "pending"
          : "received"
        : tx.status === "paid"
          ? "pending"
          : "paid";

    const formData = new FormData();
    formData.set("id", tx.id);
    formData.set("status", nextStatus);

    startTransition(async () => {
      await toggleTransactionStatusAction({}, formData);
      router.refresh();
    });
  }

  const hasAny = GROUP_ORDER.some((g) => groups[g].length > 0);

  if (!hasAny) {
    return (
      <p className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
        Nenhum lançamento neste mês. Cadastre ganhos em Ganhos ou gastos em
        Gastos.
      </p>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {GROUP_ORDER.map((groupKey) => {
        const items = groups[groupKey];
        if (items.length === 0) return null;

        return (
          <section key={groupKey}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {GROUP_LABELS[groupKey]}
            </h3>

            {/* Mobile: lista em cards */}
            <ul className="space-y-2 sm:hidden">
              {items.map((tx) => {
                const isDone =
                  tx.status === "paid" || tx.status === "received";
                const isIncome = tx.type === "income";

                return (
                  <li
                    key={tx.id}
                    className="flex items-center gap-3 rounded-2xl border border-border/60 px-3 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "truncate text-sm font-medium",
                            isDone && "text-muted-foreground line-through",
                          )}
                        >
                          {tx.description}
                        </p>
                        <span
                          className={cn(
                            "shrink-0 text-sm font-semibold tabular-nums",
                            isIncome ? "text-emerald-400" : "text-rose-400",
                          )}
                        >
                          {isIncome ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {formatDay(tx.transactionDate)}
                        </span>
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium",
                            isDone
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {statusLabel(tx)}
                        </span>
                      </div>
                      <TransactionMeta tx={tx} />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={isPending}
                      onClick={() => toggle(tx)}
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
                  </li>
                );
              })}
            </ul>

            {/* Desktop: tabela */}
            <div className="hidden overflow-x-auto rounded-2xl border border-border/60 sm:block">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 font-medium">Descrição</th>
                    <th className="px-4 py-3 font-medium">Categoria</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Valor</th>
                    <th className="px-4 py-3 text-right font-medium">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {items.map((tx) => {
                    const isDone =
                      tx.status === "paid" || tx.status === "received";
                    const isIncome = tx.type === "income";

                    return (
                      <tr
                        key={tx.id}
                        className="transition-colors hover:bg-muted/20"
                      >
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                          {formatDay(tx.transactionDate)}
                        </td>
                        <td className="max-w-[16rem] px-4 py-3">
                          <p
                            className={cn(
                              "truncate font-medium",
                              isDone && "text-muted-foreground line-through",
                            )}
                          >
                            {tx.description}
                          </p>
                          {(tx.creditCardName || tx.installmentNumber) && (
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {[
                                tx.creditCardName,
                                tx.installmentNumber
                                  ? `Parcela ${tx.installmentNumber}`
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                          {tx.categoryName ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                              isDone
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {statusLabel(tx)}
                          </span>
                        </td>
                        <td
                          className={cn(
                            "whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums",
                            isIncome ? "text-emerald-400" : "text-rose-400",
                          )}
                        >
                          {isIncome ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={isPending}
                            onClick={() => toggle(tx)}
                            className="size-9 rounded-xl"
                            aria-label={
                              isDone
                                ? "Marcar como pendente"
                                : "Marcar como pago"
                            }
                          >
                            {isDone ? (
                              <RotateCcw className="size-4" />
                            ) : (
                              <Check className="size-4" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
