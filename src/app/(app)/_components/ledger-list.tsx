"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, RotateCcw } from "lucide-react";

import { upsertExpenseAction } from "@/src/actions/finance/expenses";
import { upsertIncomeAction } from "@/src/actions/finance/incomes";
import { toggleLedgerStatusAction } from "@/src/actions/finance/toggle-status";
import type { FinanceActionState } from "@/src/actions/finance/finance-schema";
import type { LedgerSource } from "@/src/lib/finance/month-summary";
import {
  formatCalendarDate,
  formatDateTimeInBrazil,
  toDateOnlyString,
} from "@/src/lib/finance/dates";
import { formatCurrency } from "@/src/lib/helpers/format";
import { Button } from "@/src/components/ui/button";
import { FormSelect } from "@/src/components/ui/form-select";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { cn } from "@/src/lib/utils";

const PAYMENT_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "Crédito",
  debit_card: "Débito",
  bank_transfer: "Transferência",
  cash: "Dinheiro",
};

const PAYMENT_METHODS = [
  { value: "pix", label: "Pix" },
  { value: "credit_card", label: "Cartão de crédito" },
  { value: "debit_card", label: "Cartão de débito" },
  { value: "bank_transfer", label: "Transferência" },
  { value: "cash", label: "Dinheiro" },
] as const;

const initialState: FinanceActionState = {};

export type LedgerItem = {
  id: string;
  description: string;
  amount: string;
  status: "pending" | "paid" | "received" | "canceled";
  paymentMethod: string;
  transactionDate: Date;
  categoryId: string | null;
  categoryName: string | null;
  creditCardId?: string | null;
  creditCardName?: string | null;
  purchasedAt?: Date | null;
  notes: string | null;
  fixedIncomeId?: string | null;
};

type CategoryOption = { id: string; name: string };
type CardOption = { id: string; name: string };

function formatDay(date: Date) {
  return formatCalendarDate(date);
}

function formatDateTime(date: Date) {
  return formatDateTimeInBrazil(date);
}

function statusLabel(status: LedgerItem["status"], kind: "income" | "expense") {
  if (status === "pending") return "Pendente";
  if (status === "received" || (kind === "income" && status === "paid")) {
    return "Recebido";
  }
  if (status === "paid") return "Pago";
  return "Cancelado";
}

export function LedgerList({
  items,
  kind,
  source,
  categories,
  cards = [],
}: {
  items: LedgerItem[];
  kind: "income" | "expense";
  source: Extract<LedgerSource, "income" | "expense">;
  categories: CategoryOption[];
  cards?: CardOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<LedgerItem | null>(null);

  function toggle(item: LedgerItem) {
    const done = item.status === "paid" || item.status === "received";
    const nextStatus =
      kind === "income"
        ? done
          ? "pending"
          : "received"
        : done
          ? "pending"
          : "paid";

    const formData = new FormData();
    formData.set("id", item.id);
    formData.set("source", source);
    formData.set("status", nextStatus);

    startTransition(async () => {
      await toggleLedgerStatusAction({}, formData);
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
        <table className="w-full min-w-190 border-collapse text-left text-sm">
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
            {items.map((item) => {
              const isDone = item.status === "paid" || item.status === "received";
              const canEdit = kind === "expense" || !item.fixedIncomeId;

              return (
                <tr key={item.id} className="transition-colors hover:bg-muted/20">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground tabular-nums">
                    {formatDay(item.transactionDate)}
                  </td>
                  <td className="max-w-64 px-4 py-3">
                    <p
                      className={cn(
                        "truncate font-medium",
                        isDone && "text-muted-foreground line-through",
                      )}
                    >
                      {item.description}
                    </p>
                    {(item.creditCardName ||
                      item.fixedIncomeId ||
                      item.purchasedAt) && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {[
                          item.creditCardName,
                          item.purchasedAt
                            ? `Feito em ${formatDateTime(item.purchasedAt)}`
                            : null,
                          item.fixedIncomeId ? "Renda fixa" : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {item.categoryName ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {PAYMENT_LABELS[item.paymentMethod] ?? item.paymentMethod}
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
                      {statusLabel(item.status, kind)}
                    </span>
                  </td>
                  <td
                    className={cn(
                      "whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums",
                      kind === "income" ? "text-emerald-400" : "text-rose-400",
                    )}
                  >
                    {kind === "income" ? "+" : "-"}
                    {formatCurrency(Number(item.amount))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {canEdit && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setEditing(item)}
                          className="size-9 rounded-xl"
                          aria-label="Editar"
                        >
                          <Pencil className="size-4" />
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={isPending}
                        onClick={() => toggle(item)}
                        className="size-9 rounded-xl"
                        aria-label={
                          isDone ? "Marcar como pendente" : "Confirmar"
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

      <EditLedgerDialog
        item={editing}
        kind={kind}
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

function EditLedgerDialog({
  item,
  kind,
  categories,
  cards,
  open,
  onOpenChange,
}: {
  item: LedgerItem | null;
  kind: "income" | "expense";
  categories: CategoryOption[];
  cards: CardOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const actionFn = kind === "income" ? upsertIncomeAction : upsertExpenseAction;
  const [state, action, pending] = useActionState(actionFn, initialState);

  useEffect(() => {
    if (!state.success) return;
    onOpenChange(false);
    router.refresh();
  }, [state.success, onOpenChange, router]);

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {kind === "income" ? "ganho" : "gasto"}</DialogTitle>
          <DialogDescription>Altere os dados deste lançamento.</DialogDescription>
        </DialogHeader>
        <form
          key={item.id}
          action={action}
          className="flex min-h-0 flex-1 flex-col"
        >
          <DialogBody className="space-y-5">
            <input type="hidden" name="id" value={item.id} />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  label="Descrição"
                  name="description"
                  defaultValue={item.description}
                  error={state.fieldErrors?.description?.[0]}
                />
              </div>
              <Field
                label="Valor"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={String(Number(item.amount))}
                error={state.fieldErrors?.amount?.[0]}
              />
              <Field
                label="Data"
                name="transactionDate"
                type="date"
                defaultValue={toDateOnlyString(item.transactionDate)}
                error={state.fieldErrors?.transactionDate?.[0]}
              />
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <FormSelect
                  id="edit-status"
                  name="status"
                  defaultValue={
                    kind === "income"
                      ? item.status === "received"
                        ? "received"
                        : "pending"
                      : item.status === "paid"
                        ? "paid"
                        : "pending"
                  }
                  options={
                    kind === "income"
                      ? [
                          { value: "pending", label: "Pendente" },
                          { value: "received", label: "Recebido" },
                        ]
                      : [
                          { value: "pending", label: "Pendente" },
                          { value: "paid", label: "Pago" },
                        ]
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-paymentMethod">Pagamento</Label>
                <FormSelect
                  id="edit-paymentMethod"
                  name="paymentMethod"
                  defaultValue={item.paymentMethod}
                  options={PAYMENT_METHODS}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-categoryId">Categoria</Label>
                <FormSelect
                  id="edit-categoryId"
                  name="categoryId"
                  defaultValue={item.categoryId ?? ""}
                  options={[
                    { value: "", label: "Sem categoria" },
                    ...categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    })),
                  ]}
                />
              </div>
              {kind === "expense" && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-creditCardId">Cartão (opcional)</Label>
                  <FormSelect
                    id="edit-creditCardId"
                    name="creditCardId"
                    defaultValue={item.creditCardId ?? ""}
                    options={[
                      { value: "", label: "Nenhum" },
                      ...cards.map((card) => ({
                        value: card.id,
                        label: card.name,
                      })),
                    ]}
                  />
                </div>
              )}
            </div>
            {state.error && (
              <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {state.error}
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-xl sm:w-28"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="h-11 flex-1 rounded-xl font-semibold sm:flex-none sm:min-w-36"
            >
              {pending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  name,
  error,
  ...props
}: {
  label: string;
  name: string;
  error?: string;
} & React.ComponentProps<"input">) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`edit-${name}`}>{label}</Label>
      <Input
        id={`edit-${name}`}
        name={name}
        aria-invalid={!!error}
        className="h-11 rounded-xl text-base"
        {...props}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
