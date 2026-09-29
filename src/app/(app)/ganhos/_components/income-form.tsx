"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { upsertIncomeAction } from "@/src/actions/finance/incomes";
import { upsertFixedIncomeAction } from "@/src/actions/finance/plans";
import type { FinanceActionState } from "@/src/actions/finance/finance-schema";
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
import { todayDateInputValue } from "@/src/lib/finance/dates";
import { cn } from "@/src/lib/utils";

type CategoryOption = { id: string; name: string };

const PAYMENT_METHODS = [
  { value: "pix", label: "Pix" },
  { value: "credit_card", label: "Cartão de crédito" },
  { value: "debit_card", label: "Cartão de débito" },
  { value: "bank_transfer", label: "Transferência" },
  { value: "cash", label: "Dinheiro" },
] as const;

const initialState: FinanceActionState = {};

function todayISO() {
  return todayDateInputValue();
}

export function IncomeFormDialog({
  categories,
  defaultOpen = false,
  defaultKind = "income",
}: {
  categories: CategoryOption[];
  defaultOpen?: boolean;
  defaultKind?: "income" | "fixed_income";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [kind, setKind] = useState<"income" | "fixed_income">(defaultKind);
  const [incomeState, incomeAction, incomePending] = useActionState(
    upsertIncomeAction,
    initialState,
  );
  const [fixedState, fixedAction, fixedPending] = useActionState(
    upsertFixedIncomeAction,
    initialState,
  );

  const state = kind === "income" ? incomeState : fixedState;
  const pending = incomePending || fixedPending;
  const successId = state.success ? (state.data?.id ?? null) : null;
  const [seenSuccessId, setSeenSuccessId] = useState<string | null>(null);
  if (successId && successId !== seenSuccessId) {
    setSeenSuccessId(successId);
    setOpen(false);
  }

  useEffect(() => {
    if (!successId) return;
    router.refresh();
    router.replace("/ganhos");
  }, [successId, router]);

  const incomeCategories = useMemo(() => categories, [categories]);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="h-11 w-full gap-2 rounded-xl font-semibold sm:h-12 sm:w-auto"
      >
        <Plus className="size-4" />
        Novo ganho
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) router.replace("/ganhos");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo ganho</DialogTitle>
            <DialogDescription>
              Cadastre um ganho avulso ou uma renda fixa mensal.
            </DialogDescription>
          </DialogHeader>
          <form
            action={kind === "income" ? incomeAction : fixedAction}
            className="flex min-h-0 flex-1 flex-col"
          >
            <DialogBody className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["income", "Avulso"],
                    ["fixed_income", "Renda fixa"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setKind(value)}
                    className={cn(
                      "h-11 rounded-xl border text-sm font-medium",
                      kind === value
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/60 text-muted-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {kind === "fixed_income" && (
                <input type="hidden" name="status" value="active" />
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field
                    label="Descrição"
                    name="description"
                    placeholder="Ex.: Salário, Freelance"
                    error={state.fieldErrors?.description?.[0]}
                  />
                </div>
                {kind === "income" ? (
                  <>
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
                      <Label htmlFor="income-status">Status</Label>
                      <FormSelect
                        id="income-status"
                        name="status"
                        defaultValue="received"
                        options={[
                          { value: "pending", label: "Pendente" },
                          { value: "received", label: "Recebido" },
                        ]}
                      />
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
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="income-payment">Pagamento</Label>
                  <FormSelect
                    id="income-payment"
                    name="paymentMethod"
                    defaultValue="pix"
                    options={PAYMENT_METHODS}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income-category">Categoria</Label>
                  <FormSelect
                    id="income-category"
                    name="categoryId"
                    defaultValue=""
                    options={[
                      { value: "", label: "Sem categoria" },
                      ...incomeCategories.map((category) => ({
                        value: category.id,
                        label: category.name,
                      })),
                    ]}
                  />
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
