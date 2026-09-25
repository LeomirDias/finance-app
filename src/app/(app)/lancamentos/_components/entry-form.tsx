"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { upsertTransactionAction } from "@/src/actions/finance/upsert-transaction";
import { createInstallmentPlanAction } from "@/src/actions/finance/upsert-installment";
import { upsertRecurrentAction } from "@/src/actions/finance/upsert-recurrent";
import type { FinanceActionState } from "@/src/actions/finance/finance-schema";
import { Button } from "@/src/components/ui/button";
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

type CategoryOption = {
  id: string;
  name: string;
  type: "income" | "expense";
};

type CardOption = {
  id: string;
  name: string;
};

type EntryKind =
  | "income"
  | "expense"
  | "installment"
  | "recurring_expense"
  | "subscription"
  | "fixed_income";

const ENTRY_KINDS: { value: EntryKind; label: string }[] = [
  { value: "income", label: "Ganho" },
  { value: "expense", label: "Gasto" },
  { value: "installment", label: "Parcelado" },
  { value: "recurring_expense", label: "Recorrente" },
  { value: "subscription", label: "Assinatura" },
  { value: "fixed_income", label: "Renda fixa" },
];

const PAYMENT_METHODS = [
  { value: "pix", label: "Pix" },
  { value: "credit_card", label: "Cartão de crédito" },
  { value: "debit_card", label: "Cartão de débito" },
  { value: "bank_transfer", label: "Transferência" },
  { value: "cash", label: "Dinheiro" },
] as const;

const initialState: FinanceActionState = {};

const selectClass =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-base font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

type EntryFormDialogProps = {
  categories: CategoryOption[];
  cards: CardOption[];
  defaultOpen?: boolean;
};

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function EntryFormDialog({
  categories,
  cards,
  defaultOpen = false,
}: EntryFormDialogProps) {
  const router = useRouter();
  const [kind, setKind] = useState<EntryKind>("expense");
  const [open, setOpen] = useState(defaultOpen);

  const [txState, txAction, txPending] = useActionState(
    upsertTransactionAction,
    initialState,
  );
  const [instState, instAction, instPending] = useActionState(
    createInstallmentPlanAction,
    initialState,
  );
  const [recState, recAction, recPending] = useActionState(
    upsertRecurrentAction,
    initialState,
  );

  const state =
    kind === "installment"
      ? instState
      : kind === "income" || kind === "expense"
        ? txState
        : recState;
  const pending = txPending || instPending || recPending;

  useEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      router.refresh();
      router.replace("/lancamentos");
    }
  }, [state.success, router]);

  const filteredCategories = useMemo(() => {
    const type =
      kind === "income" || kind === "fixed_income" ? "income" : "expense";
    return categories.filter((c) => c.type === type);
  }, [categories, kind]);

  const action =
    kind === "installment"
      ? instAction
      : kind === "income" || kind === "expense"
        ? txAction
        : recAction;

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="h-11 gap-2 rounded-xl font-semibold sm:h-12"
      >
        <Plus className="size-4" />
        Novo lançamento
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) router.replace("/lancamentos");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo lançamento</DialogTitle>
            <DialogDescription>
              Cadastre ganho, gasto, parcela, recorrente ou assinatura.
            </DialogDescription>
          </DialogHeader>

          <form action={action} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="space-y-5">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <div className="flex flex-wrap gap-2">
                  {ENTRY_KINDS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setKind(item.value)}
                      className={cn(
                        "h-10 rounded-xl border px-3 text-sm font-medium transition-colors",
                        kind === item.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/60 bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {(kind === "subscription" ||
                kind === "recurring_expense" ||
                kind === "fixed_income") && (
                <input type="hidden" name="recurrenceKind" value={kind} />
              )}

              {(kind === "income" || kind === "expense") && (
                <input type="hidden" name="type" value={kind} />
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field
                    label="Descrição"
                    name="description"
                    placeholder="Ex.: Mercado, Netflix, Salário"
                    error={state.fieldErrors?.description?.[0]}
                  />
                </div>

                {kind === "installment" ? (
                  <>
                    <Field
                      label="Valor total"
                      name="totalAmount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0,00"
                      error={state.fieldErrors?.totalAmount?.[0]}
                    />
                    <Field
                      label="Número de parcelas"
                      name="totalInstallments"
                      type="number"
                      min="2"
                      max="60"
                      defaultValue="2"
                      error={state.fieldErrors?.totalInstallments?.[0]}
                    />
                    <Field
                      label="Data da 1ª parcela"
                      name="firstDueDate"
                      type="date"
                      defaultValue={todayISO()}
                      error={state.fieldErrors?.firstDueDate?.[0]}
                    />
                  </>
                ) : kind === "income" || kind === "expense" ? (
                  <>
                    <Field
                      label="Valor"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0,00"
                      error={state.fieldErrors?.amount?.[0]}
                    />
                    <Field
                      label="Data"
                      name="transactionDate"
                      type="date"
                      defaultValue={todayISO()}
                      error={state.fieldErrors?.transactionDate?.[0]}
                    />
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        name="status"
                        defaultValue={kind === "income" ? "received" : "paid"}
                        className={selectClass}
                      >
                        <option value="pending">Pendente</option>
                        {kind === "income" ? (
                          <option value="received">Recebido</option>
                        ) : (
                          <option value="paid">Pago</option>
                        )}
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <Field
                      label="Valor mensal"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0,00"
                      error={state.fieldErrors?.amount?.[0]}
                    />
                    <Field
                      label="Dia do mês"
                      name="dayOfMonth"
                      type="number"
                      min="1"
                      max="31"
                      defaultValue="1"
                      error={state.fieldErrors?.dayOfMonth?.[0]}
                    />
                    <Field
                      label="Início"
                      name="startDate"
                      type="date"
                      defaultValue={todayISO()}
                      error={state.fieldErrors?.startDate?.[0]}
                    />
                    <Field
                      label="Fim (opcional)"
                      name="endDate"
                      type="date"
                      error={state.fieldErrors?.endDate?.[0]}
                    />
                    <input type="hidden" name="status" value="active" />
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Pagamento</Label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    defaultValue={
                      kind === "income" || kind === "fixed_income"
                        ? "pix"
                        : "credit_card"
                    }
                    className={selectClass}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoryId">Categoria</Label>
                  <select
                    id="categoryId"
                    name="categoryId"
                    className={selectClass}
                    defaultValue=""
                  >
                    <option value="">Sem categoria</option>
                    {filteredCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {kind !== "income" && kind !== "fixed_income" && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="creditCardId">Cartão (opcional)</Label>
                    <select
                      id="creditCardId"
                      name="creditCardId"
                      className={selectClass}
                      defaultValue=""
                    >
                      <option value="">Nenhum</option>
                      {cards.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
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
                onClick={() => setOpen(false)}
                className="h-11 rounded-xl sm:w-28"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={pending}
                className="h-11 flex-1 rounded-xl font-semibold sm:flex-none sm:min-w-36"
              >
                {pending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
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
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        name={name}
        aria-invalid={!!error}
        className="h-11 rounded-xl text-base"
        {...props}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
