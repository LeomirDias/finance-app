"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { upsertExpenseAction } from "@/src/actions/finance/expenses";
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

type CategoryOption = { id: string; name: string };
type CardOption = { id: string; name: string };

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

function todayISO() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function ExpenseFormDialog({
  categories,
  cards,
  defaultOpen = false,
}: {
  categories: CategoryOption[];
  cards: CardOption[];
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [state, action, pending] = useActionState(
    upsertExpenseAction,
    initialState,
  );
  const successId = state.success ? (state.data?.id ?? null) : null;
  const [seenSuccessId, setSeenSuccessId] = useState<string | null>(null);
  if (successId && successId !== seenSuccessId) {
    setSeenSuccessId(successId);
    setOpen(false);
  }

  useEffect(() => {
    if (!successId) return;
    router.refresh();
    router.replace("/gastos");
  }, [successId, router]);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="h-11 w-full gap-2 rounded-xl font-semibold sm:h-12 sm:w-auto"
      >
        <Plus className="size-4" />
        Novo gasto
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) router.replace("/gastos");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo gasto</DialogTitle>
            <DialogDescription>
              Cadastre um gasto avulso. Parcelas, recorrentes e assinaturas
              ficam nas telas próprias.
            </DialogDescription>
          </DialogHeader>
          <form action={action} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field
                    label="Descrição"
                    name="description"
                    placeholder="Ex.: Mercado, Farmácia"
                    error={state.fieldErrors?.description?.[0]}
                  />
                </div>
                <Field
                  label="Valor"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
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
                  <Label htmlFor="expense-status">Status</Label>
                  <select
                    id="expense-status"
                    name="status"
                    defaultValue="paid"
                    className={selectClass}
                  >
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-payment">Pagamento</Label>
                  <select
                    id="expense-payment"
                    name="paymentMethod"
                    defaultValue="pix"
                    className={selectClass}
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-category">Categoria</Label>
                  <select
                    id="expense-category"
                    name="categoryId"
                    className={selectClass}
                    defaultValue=""
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="expense-card">Cartão (opcional)</Label>
                  <select
                    id="expense-card"
                    name="creditCardId"
                    className={selectClass}
                    defaultValue=""
                  >
                    <option value="">Nenhum</option>
                    {cards.map((card) => (
                      <option key={card.id} value={card.id}>
                        {card.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                className="h-12 w-full rounded-xl sm:h-11 sm:w-28"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={pending}
                className="h-12 w-full rounded-xl font-semibold sm:h-11 sm:w-auto"
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
