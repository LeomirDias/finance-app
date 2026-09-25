"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CreditCard, Pencil, Repeat } from "lucide-react";

import type { RecurrentSummary } from "@/src/actions/finance/queries";
import {
  deactivateRecurrentAction,
  upsertRecurrentAction,
} from "@/src/actions/finance/upsert-recurrent";
import type { FinanceActionState } from "@/src/actions/finance/finance-schema";
import { formatCurrency } from "@/src/lib/helpers/format";
import { toDateOnlyString } from "@/src/lib/finance/dates";
import { cn } from "@/src/lib/utils";
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

const PAYMENT_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
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

const STATUS_LABELS: Record<RecurrentSummary["status"], string> = {
  active: "Ativa",
  inactive: "Inativa",
};

const STATUS_STYLES: Record<RecurrentSummary["status"], string> = {
  active: "bg-primary/15 text-primary-light",
  inactive: "bg-muted text-muted-foreground",
};

const selectClass =
  "h-11 w-full rounded-xl border border-border bg-background px-3 text-base font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

const initialState: FinanceActionState = {};

type CategoryOption = {
  id: string;
  name: string;
  type: "income" | "expense";
};

type CardOption = { id: string; name: string };

type RecurrentPlansGridProps = {
  items: RecurrentSummary[];
  kind: "subscription" | "recurring_expense";
  categories: CategoryOption[];
  cards: CardOption[];
  emptyLabel: string;
  singularLabel: string;
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function occurrenceStatusLabel(
  status: NonNullable<RecurrentSummary["thisMonthOccurrence"]>["status"],
) {
  if (status === "paid") return "Pago";
  if (status === "received") return "Recebido";
  if (status === "pending") return "Pendente";
  return "Cancelado";
}

export function RecurrentPlansGrid({
  items,
  kind,
  categories,
  cards,
  emptyLabel,
  singularLabel,
}: RecurrentPlansGridProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<RecurrentSummary | null>(null);
  const [editing, setEditing] = useState(false);

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border/60 px-4 py-10 text-center text-sm text-muted-foreground">
        {emptyLabel}
      </p>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {items.map((item) => {
          const occurrence = item.thisMonthOccurrence;
          const isDone =
            occurrence?.status === "paid" || occurrence?.status === "received";

          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => {
                  setSelected(item);
                  setEditing(false);
                }}
                className="flex h-full w-full flex-col gap-4 rounded-2xl border border-border/60 p-5 text-left transition-colors hover:border-primary/40 hover:bg-muted/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{item.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {[
                        item.categoryName,
                        item.creditCardName,
                        PAYMENT_LABELS[item.paymentMethod] ?? item.paymentMethod,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                      STATUS_STYLES[item.status],
                    )}
                  >
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Valor mensal
                  </p>
                  <p className="mt-0.5 text-xl font-semibold tabular-nums text-rose-400">
                    {formatCurrency(item.amount)}
                  </p>
                </div>

                <div className="mt-auto grid grid-cols-2 gap-3 border-t border-border/50 pt-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Dia
                    </p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums">
                      {item.dayOfMonth}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      Este mês
                    </p>
                    <p
                      className={cn(
                        "mt-0.5 text-sm font-semibold",
                        !occurrence && "text-muted-foreground",
                        isDone && "text-emerald-400",
                        occurrence?.status === "pending" && "text-amber-400",
                      )}
                    >
                      {occurrence
                        ? occurrenceStatusLabel(occurrence.status)
                        : "—"}
                    </p>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setEditing(false);
          }
        }}
      >
        <DialogContent className="max-w-3xl sm:w-[min(100%-2rem,48rem)]">
          {selected &&
            (editing ? (
              <EditRecurrentForm
                item={selected}
                kind={kind}
                categories={categories}
                cards={cards}
                singularLabel={singularLabel}
                onCancel={() => setEditing(false)}
                onSuccess={() => {
                  setSelected(null);
                  setEditing(false);
                  router.refresh();
                }}
              />
            ) : (
              <RecurrentDetail
                item={selected}
                singularLabel={singularLabel}
                onEdit={() => setEditing(true)}
                onDeactivated={() => {
                  setSelected(null);
                  router.refresh();
                }}
              />
            ))}
        </DialogContent>
      </Dialog>
    </>
  );
}

function RecurrentDetail({
  item,
  singularLabel,
  onEdit,
  onDeactivated,
}: {
  item: RecurrentSummary;
  singularLabel: string;
  onEdit: () => void;
  onDeactivated: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const occurrence = item.thisMonthOccurrence;
  const isDone =
    occurrence?.status === "paid" || occurrence?.status === "received";

  return (
    <>
      <DialogHeader>
        <DialogTitle>{item.description}</DialogTitle>
        <DialogDescription>
          Detalhes e cobrança deste mês da {singularLabel}
        </DialogDescription>
      </DialogHeader>

      <DialogBody className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium",
              STATUS_STYLES[item.status],
            )}
          >
            {STATUS_LABELS[item.status]}
          </span>
          {item.categoryName && (
            <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {item.categoryName}
            </span>
          )}
          {item.creditCardName && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              <CreditCard className="size-3" />
              {item.creditCardName}
            </span>
          )}
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            {PAYMENT_LABELS[item.paymentMethod] ?? item.paymentMethod}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="Valor mensal" value={formatCurrency(item.amount)} />
          <Metric label="Dia do mês" value={String(item.dayOfMonth)} />
          <Metric
            label="Este mês"
            value={
              occurrence
                ? occurrenceStatusLabel(occurrence.status)
                : "Sem lançamento"
            }
            tone={isDone ? "positive" : undefined}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <InfoTile
            icon={<CalendarDays className="size-4" />}
            label="Início"
            value={formatDate(item.startDate)}
          />
          <InfoTile
            icon={<Repeat className="size-4" />}
            label="Fim"
            value={item.endDate ? formatDate(item.endDate) : "Sem prazo"}
          />
        </div>

        {item.notes && (
          <p className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            {item.notes}
          </p>
        )}
      </DialogBody>

      <DialogFooter className="gap-2 sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2 rounded-xl"
            onClick={onEdit}
          >
            <Pencil className="size-4" />
            Editar
          </Button>
          {item.status === "active" && (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              className="h-11 rounded-xl"
              onClick={() => {
                const fd = new FormData();
                fd.set("id", item.id);
                startTransition(async () => {
                  await deactivateRecurrentAction({}, fd);
                  onDeactivated();
                });
              }}
            >
              Desativar
            </Button>
          )}
        </div>
      </DialogFooter>
    </>
  );
}

function EditRecurrentForm({
  item,
  kind,
  categories,
  cards,
  singularLabel,
  onCancel,
  onSuccess,
}: {
  item: RecurrentSummary;
  kind: "subscription" | "recurring_expense";
  categories: CategoryOption[];
  cards: CardOption[];
  singularLabel: string;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [state, action, pending] = useActionState(
    upsertRecurrentAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === "expense"),
    [categories],
  );

  return (
    <>
      <DialogHeader>
        <DialogTitle>Editar {singularLabel}</DialogTitle>
        <DialogDescription>
          Atualize valor, dia de cobrança e demais dados.
        </DialogDescription>
      </DialogHeader>

      <form
        key={item.id}
        action={action}
        className="flex min-h-0 flex-1 flex-col"
      >
        <DialogBody className="space-y-5">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="recurrenceKind" value={kind} />
          <input type="hidden" name="status" value={item.status} />

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
              label="Valor mensal"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              defaultValue={String(item.amount)}
              error={state.fieldErrors?.amount?.[0]}
            />
            <Field
              label="Dia do mês"
              name="dayOfMonth"
              type="number"
              min="1"
              max="31"
              defaultValue={String(item.dayOfMonth)}
              error={state.fieldErrors?.dayOfMonth?.[0]}
            />
            <Field
              label="Início"
              name="startDate"
              type="date"
              defaultValue={toDateOnlyString(item.startDate)}
              error={state.fieldErrors?.startDate?.[0]}
            />
            <Field
              label="Fim (opcional)"
              name="endDate"
              type="date"
              defaultValue={item.endDate ? toDateOnlyString(item.endDate) : ""}
              error={state.fieldErrors?.endDate?.[0]}
            />

            <div className="space-y-2">
              <Label htmlFor="rec-paymentMethod">Pagamento</Label>
              <select
                id="rec-paymentMethod"
                name="paymentMethod"
                defaultValue={item.paymentMethod}
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
              <Label htmlFor="rec-categoryId">Categoria</Label>
              <select
                id="rec-categoryId"
                name="categoryId"
                className={selectClass}
                defaultValue={item.categoryId ?? ""}
              >
                <option value="">Sem categoria</option>
                {filteredCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="rec-creditCardId">Cartão (opcional)</Label>
              <select
                id="rec-creditCardId"
                name="creditCardId"
                className={selectClass}
                defaultValue={item.creditCardId ?? ""}
              >
                <option value="">Nenhum</option>
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
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
            onClick={onCancel}
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
      <Label htmlFor={`rec-${name}`}>{label}</Label>
      <Input
        id={`rec-${name}`}
        name={name}
        aria-invalid={!!error}
        className="h-11 rounded-xl text-base"
        {...props}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
