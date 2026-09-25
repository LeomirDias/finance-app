"use client";

import { useActionState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { upsertTransactionAction } from "@/src/actions/finance/upsert-transaction";
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
import { toDateOnlyString } from "@/src/lib/finance/dates";
import type { ListedTransaction } from "@/src/app/(app)/lancamentos/_components/transaction-list";

type CategoryOption = {
  id: string;
  name: string;
  type: "income" | "expense";
};

type CardOption = {
  id: string;
  name: string;
};

const PAYMENT_METHODS = [
  { value: "pix", label: "Pix" },
  { value: "credit_card", label: "Cartão de crédito" },
  { value: "debit_card", label: "Cartão de débito" },
  { value: "bank_transfer", label: "Transferência" },
  { value: "cash", label: "Dinheiro" },
] as const;

const selectClass =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-base font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

const initialState: FinanceActionState = {};

type EditTransactionDialogProps = {
  transaction: ListedTransaction | null;
  categories: CategoryOption[];
  cards: CardOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditTransactionDialog({
  transaction,
  categories,
  cards,
  open,
  onOpenChange,
}: EditTransactionDialogProps) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    upsertTransactionAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      router.refresh();
    }
  }, [state.success, onOpenChange, router]);

  const filteredCategories = useMemo(() => {
    if (!transaction) return [];
    return categories.filter((c) => c.type === transaction.type);
  }, [categories, transaction]);

  if (!transaction) return null;

  const isIncome = transaction.type === "income";
  const formKey = transaction.id;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {isIncome ? "ganho" : "gasto"}</DialogTitle>
          <DialogDescription>
            Altere os dados deste lançamento avulso.
          </DialogDescription>
        </DialogHeader>

        <form
          key={formKey}
          action={action}
          className="flex min-h-0 flex-1 flex-col"
        >
          <DialogBody className="space-y-5">
            <input type="hidden" name="id" value={transaction.id} />
            <input type="hidden" name="type" value={transaction.type} />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field
                  label="Descrição"
                  name="description"
                  defaultValue={transaction.description}
                  error={state.fieldErrors?.description?.[0]}
                />
              </div>

              <Field
                label="Valor"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={String(Number(transaction.amount))}
                error={state.fieldErrors?.amount?.[0]}
              />

              <Field
                label="Data"
                name="transactionDate"
                type="date"
                defaultValue={toDateOnlyString(transaction.transactionDate)}
                error={state.fieldErrors?.transactionDate?.[0]}
              />

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  name="status"
                  defaultValue={transaction.status}
                  className={selectClass}
                >
                  <option value="pending">Pendente</option>
                  {isIncome ? (
                    <option value="received">Recebido</option>
                  ) : (
                    <option value="paid">Pago</option>
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-paymentMethod">Pagamento</Label>
                <select
                  id="edit-paymentMethod"
                  name="paymentMethod"
                  defaultValue={transaction.paymentMethod}
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
                <Label htmlFor="edit-categoryId">Categoria</Label>
                <select
                  id="edit-categoryId"
                  name="categoryId"
                  className={selectClass}
                  defaultValue={transaction.categoryId ?? ""}
                >
                  <option value="">Sem categoria</option>
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {!isIncome && (
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="edit-creditCardId">Cartão (opcional)</Label>
                  <select
                    id="edit-creditCardId"
                    name="creditCardId"
                    className={selectClass}
                    defaultValue={transaction.creditCardId ?? ""}
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
