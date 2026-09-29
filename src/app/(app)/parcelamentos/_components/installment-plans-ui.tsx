"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CreditCard, Layers, Trash2 } from "lucide-react";

import { deleteInstallmentPlanAction } from "@/src/actions/finance/upsert-installment";
import type { InstallmentPlanSummary } from "@/src/actions/finance/queries";
import { formatCurrency } from "@/src/lib/helpers/format";
import { cn } from "@/src/lib/utils";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";

const PAYMENT_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  bank_transfer: "Transferência",
  cash: "Dinheiro",
};

const STATUS_LABELS: Record<InstallmentPlanSummary["status"], string> = {
  active: "Em andamento",
  completed: "Concluído",
  canceled: "Cancelado",
};

const STATUS_STYLES: Record<InstallmentPlanSummary["status"], string> = {
  active: "bg-primary/15 text-primary-light",
  completed: "bg-emerald-500/15 text-emerald-400",
  canceled: "bg-muted text-muted-foreground",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function installmentStatusLabel(
  status: InstallmentPlanSummary["installments"][number]["status"],
) {
  if (status === "paid") return "Paga";
  if (status === "received") return "Recebida";
  if (status === "pending") return "Pendente";
  return "Cancelada";
}

type InstallmentPlansGridProps = {
  plans: InstallmentPlanSummary[];
};

export function InstallmentPlansGrid({ plans }: InstallmentPlansGridProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<InstallmentPlanSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(plan: InstallmentPlanSummary) {
    const count = plan.installments.length || plan.totalInstallments;
    const confirmed = window.confirm(
      `Excluir o parcelamento "${plan.description}"? As ${count} parcelas cadastradas também serão excluídas. Esta ação não pode ser desfeita.`,
    );

    if (!confirmed) return;

    setError(null);
    const formData = new FormData();
    formData.set("id", plan.id);

    startTransition(async () => {
      const result = await deleteInstallmentPlanAction({}, formData);

      if (result.success) {
        setSelected(null);
        router.refresh();
        return;
      }

      setError(result.error ?? "Não foi possível excluir o parcelamento.");
    });
  }

  if (plans.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
        Nenhum parcelamento ativo. Cadastre um em Novo parcelamento.
      </p>
    );
  }

  return (
    <>
      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {plans.map((plan) => (
          <li key={plan.id}>
            <div className="flex h-full w-full flex-col gap-4 rounded-2xl border border-border/60 p-5 transition-colors hover:border-primary/40 hover:bg-muted/20">
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelected(plan)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate font-semibold">{plan.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[
                      plan.categoryName,
                      plan.creditCardName,
                      PAYMENT_LABELS[plan.paymentMethod] ?? plan.paymentMethod,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_STYLES[plan.status],
                    )}
                  >
                    {STATUS_LABELS[plan.status]}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={isPending}
                    aria-label={`Excluir parcelamento ${plan.description}`}
                    onClick={() => handleDelete(plan)}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelected(plan)}
                className="flex flex-1 flex-col gap-4 text-left"
              >
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      Progresso
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {plan.progressPercent}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        plan.status === "completed"
                          ? "bg-emerald-400"
                          : "bg-primary",
                      )}
                      style={{
                        width: `${Math.min(plan.progressPercent, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {plan.paidInstallments}/{plan.totalInstallments} parcelas
                    {plan.remainingInstallments > 0
                      ? ` · ${plan.remainingInstallments} restantes`
                      : " · concluído"}
                  </p>
                </div>

              <div className="mt-auto grid grid-cols-2 gap-3 border-t border-border/50 pt-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Total
                  </p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums">
                    {formatCurrency(plan.totalAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Parcela
                  </p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums">
                    {formatCurrency(plan.installmentAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Pago
                  </p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-emerald-400">
                    {formatCurrency(plan.paidAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Restante
                  </p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-rose-400">
                    {formatCurrency(plan.remainingAmount)}
                  </p>
                </div>
              </div>
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-w-5xl sm:w-[min(100%-2rem,64rem)]">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{selected.description}</DialogTitle>
                <DialogDescription>
                  Detalhes, progresso e calendário de parcelas
                </DialogDescription>
              </DialogHeader>

              <DialogBody className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      STATUS_STYLES[selected.status],
                    )}
                  >
                    {STATUS_LABELS[selected.status]}
                  </span>
                  {selected.categoryName && (
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      {selected.categoryName}
                    </span>
                  )}
                  {selected.creditCardName && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                      <CreditCard className="size-3" />
                      {selected.creditCardName}
                    </span>
                  )}
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    {PAYMENT_LABELS[selected.paymentMethod] ??
                      selected.paymentMethod}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Metric
                    label="Valor total"
                    value={formatCurrency(selected.totalAmount)}
                  />
                  <Metric
                    label="Valor da parcela"
                    value={formatCurrency(selected.installmentAmount)}
                  />
                  <Metric
                    label="Já pago"
                    value={formatCurrency(selected.paidAmount)}
                    tone="positive"
                  />
                  <Metric
                    label="Ainda falta"
                    value={formatCurrency(selected.remainingAmount)}
                    tone="negative"
                  />
                </div>

                <section className="rounded-2xl border border-border/60 p-4 sm:p-5">
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">Progresso</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {selected.paidInstallments} de{" "}
                        {selected.totalInstallments} parcelas pagas ·{" "}
                        {selected.remainingInstallments} restantes
                      </p>
                    </div>
                    <p className="text-2xl font-semibold tabular-nums text-primary-light">
                      {selected.progressPercent}%
                    </p>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        selected.status === "completed"
                          ? "bg-emerald-400"
                          : "bg-primary",
                      )}
                      style={{
                        width: `${Math.min(selected.progressPercent, 100)}%`,
                      }}
                    />
                  </div>
                </section>

                <div className="grid gap-3 sm:grid-cols-3">
                  <InfoTile
                    icon={<CalendarDays className="size-4" />}
                    label="Primeira parcela"
                    value={formatDate(selected.firstDueDate)}
                  />
                  <InfoTile
                    icon={<CalendarDays className="size-4" />}
                    label="Próximo vencimento"
                    value={
                      selected.nextDueDate
                        ? formatDate(selected.nextDueDate)
                        : "—"
                    }
                  />
                  <InfoTile
                    icon={<Layers className="size-4" />}
                    label="Última parcela"
                    value={formatDate(selected.lastDueDate)}
                  />
                </div>

                {selected.notes && (
                  <p className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                    {selected.notes}
                  </p>
                )}

                <section>
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Parcelas
                  </h3>
                  <div className="overflow-x-auto rounded-2xl border border-border/60">
                    <table className="w-full min-w-130 border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="px-4 py-3 font-medium">#</th>
                          <th className="px-4 py-3 font-medium">Vencimento</th>
                          <th className="px-4 py-3 font-medium">Status</th>
                          <th className="px-4 py-3 text-right font-medium">
                            Valor
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/50">
                        {selected.installments.map((item) => {
                          const isDone =
                            item.status === "paid" || item.status === "received";
                          return (
                            <tr key={item.id}>
                              <td className="px-4 py-3 tabular-nums text-muted-foreground">
                                {item.number}/{selected.totalInstallments}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3">
                                {formatDate(item.dueDate)}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={cn(
                                    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                                    isDone
                                      ? "bg-emerald-500/15 text-emerald-400"
                                      : "bg-muted text-muted-foreground",
                                  )}
                                >
                                  {installmentStatusLabel(item.status)}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-semibold tabular-nums">
                                {formatCurrency(item.amount)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </DialogBody>

              <DialogFooter>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isPending}
                  className="h-11 gap-2 rounded-xl"
                  onClick={() => handleDelete(selected)}
                >
                  <Trash2 />
                  {isPending ? "Excluindo..." : "Excluir parcelamento"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="rounded-2xl border border-border/60 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-lg font-semibold tabular-nums",
          tone === "positive" && "text-emerald-400",
          tone === "negative" && "text-rose-400",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border/60 px-4 py-3">
      <div className="mt-0.5 text-primary-light">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
