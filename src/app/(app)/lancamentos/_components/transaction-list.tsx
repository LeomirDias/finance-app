"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, RotateCcw } from "lucide-react";

import { toggleTransactionStatusAction } from "@/src/actions/finance/upsert-transaction";
import { EditTransactionDialog } from "@/src/app/(app)/lancamentos/_components/edit-transaction-dialog";
import { formatCurrency } from "@/src/lib/helpers/format";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";

const PAYMENT_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "Crédito",
  debit_card: "Débito",
  bank_transfer: "Transferência",
  cash: "Dinheiro",
};

export type ListedTransaction = {
  id: string;
  description: string;
  amount: string;
  type: "income" | "expense";
  status: "pending" | "paid" | "received" | "canceled";
  paymentMethod: string;
  transactionDate: Date;
  categoryId: string | null;
  categoryName: string | null;
  creditCardId: string | null;
  creditCardName: string | null;
  installmentNumber: number | null;
  installmentPlanId: string | null;
  recurrentTransactionId: string | null;
  notes: string | null;
};

type CategoryOption = {
  id: string;
  name: string;
  type: "income" | "expense";
};

type CardOption = { id: string; name: string };

function formatDay(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function statusLabel(tx: ListedTransaction) {
  if (tx.status === "pending") return "Pendente";
  if (tx.status === "paid") return "Pago";
  if (tx.status === "received") return "Recebido";
  return "Cancelado";
}

function isEditable(tx: ListedTransaction) {
  return !tx.installmentPlanId && !tx.recurrentTransactionId;
}

export function TransactionList({
  items,
  categories = [],
  cards = [],
}: {
  items: ListedTransaction[];
  categories?: CategoryOption[];
  cards?: CardOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<ListedTransaction | null>(null);

  function toggle(tx: ListedTransaction) {
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

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
        Nenhum registro encontrado com esses filtros.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-border/60">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Pagamento</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Valor</th>
              <th className="px-4 py-3 text-right font-medium">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {items.map((tx) => {
              const isDone = tx.status === "paid" || tx.status === "received";
              const isIncome = tx.type === "income";
              const canEdit = isEditable(tx);

              return (
                <tr
                  key={tx.id}
                  className="transition-colors hover:bg-muted/20"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground tabular-nums">
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
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {PAYMENT_LABELS[tx.paymentMethod] ?? tx.paymentMethod}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                        isDone
                          ? "bg-emerald-500/15 text-emerald-400"
                          : tx.status === "canceled"
                            ? "bg-destructive/15 text-destructive"
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
                    {formatCurrency(Number(tx.amount))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {canEdit && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setEditing(tx)}
                          className="size-9 rounded-xl"
                          aria-label="Editar lançamento"
                        >
                          <Pencil className="size-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={isPending}
                        onClick={() => toggle(tx)}
                        className="size-9 rounded-xl"
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
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <EditTransactionDialog
        transaction={editing}
        categories={categories}
        cards={cards}
        open={!!editing}
        onOpenChange={(next) => {
          if (!next) setEditing(null);
        }}
      />
    </>
  );
}
