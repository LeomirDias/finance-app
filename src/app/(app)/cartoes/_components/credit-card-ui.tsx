"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import {
  deleteCreditCardAction,
  upsertCreditCardAction,
} from "@/src/actions/finance/credit-cards";
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

type Card = {
  id: string;
  name: string;
  institution: string | null;
  dueDate: string | null;
  status: "active" | "inactive" | "blocked";
};

function formatDueDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR").format(
    new Date(year!, month! - 1, day!),
  );
}

const initialState: FinanceActionState = {};

function CreditCardFormFields({
  card,
  state,
}: {
  card?: Card;
  state: FinanceActionState;
}) {
  const idPrefix = card ? "edit-" : "";

  return (
    <>
      {card && <input type="hidden" name="id" value={card.id} />}

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}name`}>Nome</Label>
        <Input
          id={`${idPrefix}name`}
          name="name"
          defaultValue={card?.name ?? ""}
          placeholder="Ex.: Nubank"
          className="h-11 rounded-xl text-base"
          aria-invalid={!!state.fieldErrors?.name}
        />
        {state.fieldErrors?.name?.[0] && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}institution`}>Instituição (opcional)</Label>
        <Input
          id={`${idPrefix}institution`}
          name="institution"
          defaultValue={card?.institution ?? ""}
          placeholder="Ex.: Nu Pagamentos"
          className="h-11 rounded-xl text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}dueDate`}>Data de vencimento</Label>
        <Input
          id={`${idPrefix}dueDate`}
          name="dueDate"
          type="date"
          required
          defaultValue={card?.dueDate ?? ""}
          className="h-11 rounded-xl text-base"
          aria-invalid={!!state.fieldErrors?.dueDate}
        />
        {state.fieldErrors?.dueDate?.[0] && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.dueDate[0]}
          </p>
        )}
      </div>

      <input type="hidden" name="status" value={card?.status ?? "active"} />

      {state.error && (
        <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
    </>
  );
}

export function NewCreditCardDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(
    upsertCreditCardAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="h-11 gap-2 rounded-xl font-semibold sm:h-12"
      >
        <Plus className="size-4" />
        Novo cartão
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo cartão</DialogTitle>
            <DialogDescription>
              Informe o vencimento da fatura em aberto. Gastos no crédito entram
              nessa data.
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="space-y-4">
              <CreditCardFormFields state={state} />
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
                disabled={isPending}
                className="h-11 flex-1 rounded-xl font-semibold sm:flex-none sm:min-w-36"
              >
                {isPending ? "Salvando..." : "Adicionar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CreditCardList({ cards }: { cards: Card[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Card | null>(null);
  const [editState, editAction, editPending] = useActionState(
    upsertCreditCardAction,
    initialState,
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteCreditCardAction,
    initialState,
  );

  useEffect(() => {
    if (editState.success) {
      setEditing(null);
      router.refresh();
    }
  }, [editState.success, router]);

  useEffect(() => {
    if (deleteState.success) {
      router.refresh();
    }
  }, [deleteState.success, router]);

  if (cards.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum cartão cadastrado. Adicione um para vincular a gastos e parcelas.
      </p>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <li
            key={card.id}
            className="flex flex-col justify-between gap-4 rounded-2xl border border-border/60 p-5"
          >
            <div>
              <p className="font-medium">{card.name}</p>
              {card.institution && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.institution}
                </p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {card.dueDate
                  ? `Vence em ${formatDueDate(card.dueDate)}`
                  : "Sem data de vencimento"}
              </p>
              <span
                className={`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  card.status === "active"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {card.status === "active" ? "Ativo" : card.status}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-10 flex-1 rounded-xl"
                onClick={() => setEditing(card)}
              >
                Editar
              </Button>
              <form action={deleteAction}>
                <input type="hidden" name="id" value={card.id} />
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={deletePending}
                  className="h-10 rounded-xl"
                >
                  Excluir
                </Button>
              </form>
            </div>
          </li>
        ))}
      </ul>

      <Dialog
        open={!!editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar cartão</DialogTitle>
            <DialogDescription>
              Atualize o nome, a instituição ou a data de vencimento.
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <form action={editAction} className="flex min-h-0 flex-1 flex-col">
              <DialogBody className="space-y-4">
                <CreditCardFormFields card={editing} state={editState} />
              </DialogBody>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                  className="h-11 rounded-xl sm:w-28"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={editPending}
                  className="h-11 flex-1 rounded-xl font-semibold sm:flex-none sm:min-w-36"
                >
                  {editPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
