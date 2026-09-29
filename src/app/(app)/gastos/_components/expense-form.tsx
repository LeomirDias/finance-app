"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { upsertExpenseAction } from "@/src/actions/finance/expenses";
import type { FinanceActionState } from "@/src/actions/finance/finance-schema";
import { formatCalendarDate, nextMonthDueDate } from "@/src/lib/finance/dates";
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

type CategoryOption = { id: string; name: string };
type CardOption = { id: string; name: string; dueDay: number | null };

const PAYMENT_METHODS = [
  { value: "pix", label: "Pix" },
  { value: "credit_card", label: "Cartão de crédito" },
  { value: "debit_card", label: "Cartão de débito" },
  { value: "bank_transfer", label: "Transferência" },
  { value: "cash", label: "Dinheiro" },
] as const;

const initialState: FinanceActionState = {};

function formatNextDueDate(dueDay: number) {
  return formatCalendarDate(nextMonthDueDate(new Date(), dueDay), {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
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
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [creditCardId, setCreditCardId] = useState("");
  const [state, action, pending] = useActionState(
    upsertExpenseAction,
    initialState,
  );
  const successId = state.success ? (state.data?.id ?? null) : null;
  const [seenSuccessId, setSeenSuccessId] = useState<string | null>(null);
  if (successId && successId !== seenSuccessId) {
    setSeenSuccessId(successId);
    setOpen(false);
    setPaymentMethod("pix");
    setCreditCardId("");
  }

  useEffect(() => {
    if (!successId) return;
    router.refresh();
    router.replace("/gastos");
  }, [successId, router]);

  const selectedCard = cards.find((card) => card.id === creditCardId);
  const isCreditCard = paymentMethod === "credit_card";

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
              O lançamento entra como pendente. No crédito, a cobrança cai no
              dia de vencimento do mês seguinte.
            </DialogDescription>
          </DialogHeader>
          <form action={action} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="space-y-4">
              <Field
                label="Descrição"
                name="description"
                placeholder="Ex.: Mercado, Farmácia"
                error={state.fieldErrors?.description?.[0]}
              />
              <Field
                label="Valor"
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                error={state.fieldErrors?.amount?.[0]}
              />
              <div className="space-y-2">
                <Label htmlFor="expense-payment">Pagamento</Label>
                <FormSelect
                  id="expense-payment"
                  name="paymentMethod"
                  value={paymentMethod}
                  onValueChange={(value) => {
                    const next = value ?? "pix";
                    setPaymentMethod(next);
                    if (next !== "credit_card") setCreditCardId("");
                  }}
                  options={PAYMENT_METHODS}
                />
              </div>
              {isCreditCard && (
                <div className="space-y-2">
                  <Label htmlFor="expense-card">Cartão</Label>
                  <FormSelect
                    id="expense-card"
                    name="creditCardId"
                    value={creditCardId}
                    onValueChange={(value) => setCreditCardId(value ?? "")}
                    options={[
                      { value: "", label: "Selecione o cartão" },
                      ...cards.map((card) => ({
                        value: card.id,
                        label: card.name,
                      })),
                    ]}
                  />
                  {state.fieldErrors?.creditCardId?.[0] && (
                    <p className="text-sm text-destructive">
                      {state.fieldErrors.creditCardId[0]}
                    </p>
                  )}
                  {selectedCard?.dueDay && (
                    <p className="text-sm text-muted-foreground">
                      A cobrança entra em {formatNextDueDate(selectedCard.dueDay)}.
                    </p>
                  )}
                  {selectedCard && !selectedCard.dueDay && (
                    <p className="text-sm text-destructive">
                      Este cartão ainda não tem dia de vencimento.
                    </p>
                  )}
                  {cards.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Cadastre um cartão com dia de vencimento para lançar no
                      crédito.
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="expense-category">Categoria</Label>
                <FormSelect
                  id="expense-category"
                  name="categoryId"
                  defaultValue=""
                  options={[
                    { value: "", label: "Sem categoria" },
                    ...categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    })),
                  ]}
                />
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
