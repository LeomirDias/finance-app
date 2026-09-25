"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { deactivateRecurrentAction } from "@/src/actions/finance/upsert-recurrent";
import { formatCurrency } from "@/src/lib/helpers/format";
import { Button } from "@/src/components/ui/button";

type RecurrentItem = {
  id: string;
  description: string;
  amount: string;
  recurrenceKind: "subscription" | "recurring_expense" | "fixed_income";
  dayOfMonth: number;
  status: "active" | "inactive";
  category?: { name: string } | null;
  creditCard?: { name: string } | null;
};

const KIND_LABEL: Record<RecurrentItem["recurrenceKind"], string> = {
  subscription: "Assinatura",
  recurring_expense: "Recorrente",
  fixed_income: "Renda fixa",
};

export function RecurrentList({ items }: { items: RecurrentItem[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma assinatura ou recorrência cadastrada.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border/60">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
            <th className="px-4 py-3 font-medium">Descrição</th>
            <th className="px-4 py-3 font-medium">Tipo</th>
            <th className="px-4 py-3 font-medium">Dia</th>
            <th className="px-4 py-3 font-medium">Categoria</th>
            <th className="px-4 py-3 text-right font-medium">Valor</th>
            <th className="px-4 py-3 text-right font-medium">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {items.map((item) => (
            <tr key={item.id} className="transition-colors hover:bg-muted/20">
              <td className="px-4 py-3">
                <p className="font-medium">{item.description}</p>
                {item.creditCard && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.creditCard.name}
                    {item.status === "inactive" ? " · Inativa" : ""}
                  </p>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                {KIND_LABEL[item.recurrenceKind]}
              </td>
              <td className="whitespace-nowrap px-4 py-3 tabular-nums text-muted-foreground">
                {item.dayOfMonth}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                {item.category?.name ?? "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums">
                {formatCurrency(Number(item.amount))}
              </td>
              <td className="px-4 py-3 text-right">
                {item.status === "active" && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isPending}
                    className="h-9 rounded-xl"
                    onClick={() => {
                      const fd = new FormData();
                      fd.set("id", item.id);
                      startTransition(async () => {
                        await deactivateRecurrentAction({}, fd);
                        router.refresh();
                      });
                    }}
                  >
                    Desativar
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
