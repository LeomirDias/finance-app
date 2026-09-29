"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { createInstallmentPlanAction } from "@/src/actions/finance/upsert-installment";
import type { FinanceActionState } from "@/src/actions/finance/finance-schema";
import { formatCurrency } from "@/src/lib/helpers/format";
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
  { value: "credit_card", label: "Cartão de crédito" },
  { value: "pix", label: "Pix" },
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

export function InstallmentFormDialog({
  categories,
  cards,
}: {
  categories: CategoryOption[];
  cards: CardOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [countInput, setCountInput] = useState("2");
  const [state, action, pending] = useActionState(
    createInstallmentPlanAction,
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
  }, [successId, router]);

  const total = useMemo(() => {
    const amount = Number(amountInput);
    const count = Number(countInput);
    if (!Number.isFinite(amount) || amount <= 0) return null;
    if (!Number.isInteger(count) || count < 2 || count > 60) return null;
    return Math.round(amount * count * 100) / 100;
  }, [amountInput, countInput]);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="h-11 gap-2 rounded-xl font-semibold sm:h-12"
      >
        <Plus className="size-4" />
        Novo parcelamento
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo parcelamento</DialogTitle>
            <DialogDescription>
              Informe o valor de cada parcela e a quantidade. As parcelas
              entram só nesta tela.
            </DialogDescription>
          </DialogHeader>
          <form action={action} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field
                    label="Descrição"
                    name="description"
                    placeholder="Ex.: Notebook"
                    error={state.fieldErrors?.description?.[0]}
                  />
                </div>
                <Field
                  label="Valor da parcela"
                  name="installmentAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  error={state.fieldErrors?.installmentAmount?.[0]}
                  onChange={(event) => setAmountInput(event.target.value)}
                />
                <Field
                  label="Nº de parcelas"
                  name="totalInstallments"
                  type="number"
                  min="2"
                  max="60"
                  defaultValue="2"
                  error={state.fieldErrors?.totalInstallments?.[0]}
                  onChange={(event) => setCountInput(event.target.value)}
                />
                {total != null && (
                  <p className="text-sm text-muted-foreground sm:col-span-2">
                    Valor total:{" "}
                    <span className="font-semibold text-foreground">
                      {formatCurrency(total)}
                    </span>
                  </p>
                )}
                <Field
                  label="Data da 1ª parcela"
                  name="firstDueDate"
                  type="date"
                  defaultValue={todayISO()}
                  error={state.fieldErrors?.firstDueDate?.[0]}
                />
                <div className="space-y-2">
                  <Label htmlFor="inst-payment">Pagamento</Label>
                  <select
                    id="inst-payment"
                    name="paymentMethod"
                    defaultValue="credit_card"
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
                  <Label htmlFor="inst-category">Categoria</Label>
                  <select
                    id="inst-category"
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
                  <Label htmlFor="inst-card">Cartão (opcional)</Label>
                  <select
                    id="inst-card"
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
