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
import { CalendarDays, CreditCard, Pencil, Plus, Repeat } from "lucide-react";

import type { PlanSummary } from "@/src/actions/finance/queries";
import type { FinanceActionState } from "@/src/actions/finance/finance-schema";
import { formatCurrency } from "@/src/lib/helpers/format";
import { toDateOnlyString } from "@/src/lib/finance/dates";
import { cn } from "@/src/lib/utils";
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

type PlanAction = (
  prev: FinanceActionState,
  formData: FormData,
) => Promise<FinanceActionState>;

type RecurrentSummary = PlanSummary;

const STATUS_LABELS: Record<RecurrentSummary["status"], string> = {
  active: "Ativa",
  inactive: "Inativa",
};

const STATUS_STYLES: Record<RecurrentSummary["status"], string> = {
  active: "bg-primary/15 text-primary-light",
  inactive: "bg-muted text-muted-foreground",
};

const initialState: FinanceActionState = {};

type CategoryOption = {
  id: string;
  name: string;
  type: "income" | "expense";
};

type CardOption = { id: string; name: string };

type RecurrentPlansGridProps = {
  items: RecurrentSummary[];
  categories: CategoryOption[];
  cards: CardOption[];
  emptyLabel: string;
  singularLabel: string;
  categoryType: "income" | "expense";
  upsertAction: PlanAction;
  deactivateAction: PlanAction;
  showCard?: boolean;
  amountClassName?: string;
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
  categories,
  cards,
  emptyLabel,
  singularLabel,
  categoryType,
  upsertAction,
  deactivateAction,
  showCard = true,
  amountClassName = "text-rose-400",
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
                  <p
                    className={cn(
                      "mt-0.5 text-xl font-semibold tabular-nums",
                      amountClassName,
                    )}
                  >
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
                categories={categories}
                cards={cards}
                singularLabel={singularLabel}
                categoryType={categoryType}
                upsertAction={upsertAction}
                showCard={showCard}
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
                deactivateAction={deactivateAction}
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
  deactivateAction,
  onEdit,
  onDeactivated,
}: {
  item: RecurrentSummary;
  singularLabel: string;
  deactivateAction: PlanAction;
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
                  await deactivateAction({}, fd);
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
  categories,
  cards,
  singularLabel,
  categoryType,
  upsertAction,
  showCard,
  onCancel,
  onSuccess,
}: {
  item: RecurrentSummary;
  categories: CategoryOption[];
  cards: CardOption[];
  singularLabel: string;
  categoryType: "income" | "expense";
  upsertAction: PlanAction;
  showCard: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [state, action, pending] = useActionState(upsertAction, initialState);

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === categoryType),
    [categories, categoryType],
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
              <FormSelect
                id="rec-paymentMethod"
                name="paymentMethod"
                defaultValue={item.paymentMethod}
                options={PAYMENT_METHODS}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rec-categoryId">Categoria</Label>
              <FormSelect
                id="rec-categoryId"
                name="categoryId"
                defaultValue={item.categoryId ?? ""}
                options={[
                  { value: "", label: "Sem categoria" },
                  ...filteredCategories.map((category) => ({
                    value: category.id,
                    label: category.name,
                  })),
                ]}
              />
            </div>

            {showCard && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="rec-creditCardId">Cartão (opcional)</Label>
                <FormSelect
                  id="rec-creditCardId"
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

export function CreatePlanButton({
  label,
  title,
  description,
  categories,
  cards,
  categoryType,
  upsertAction,
  showCard = true,
  defaultPayment = "credit_card",
  defaultOpen = false,
  returnPath,
}: {
  label: string;
  title: string;
  description: string;
  categories: CategoryOption[];
  cards: CardOption[];
  categoryType: "income" | "expense";
  upsertAction: PlanAction;
  showCard?: boolean;
  defaultPayment?: string;
  defaultOpen?: boolean;
  returnPath?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [state, action, pending] = useActionState(upsertAction, initialState);
  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === categoryType),
    [categories, categoryType],
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
    if (
      returnPath &&
      new URLSearchParams(window.location.search).has("novo")
    ) {
      router.replace(returnPath);
    }
  }, [successId, returnPath, router]);

  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className="h-11 gap-2 rounded-xl font-semibold sm:h-12"
      >
        <Plus className="size-4" />
        {label}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (
            !next &&
            returnPath &&
            new URLSearchParams(window.location.search).has("novo")
          ) {
            router.replace(returnPath);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <form action={action} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="space-y-5">
              <input type="hidden" name="status" value="active" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field
                    label="Descrição"
                    name="description"
                    error={state.fieldErrors?.description?.[0]}
                  />
                </div>
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
                  defaultValue={todayISO}
                  error={state.fieldErrors?.startDate?.[0]}
                />
                <Field
                  label="Fim (opcional)"
                  name="endDate"
                  type="date"
                  error={state.fieldErrors?.endDate?.[0]}
                />
                <div className="space-y-2">
                  <Label htmlFor="new-paymentMethod">Pagamento</Label>
                  <FormSelect
                    id="new-paymentMethod"
                    name="paymentMethod"
                    defaultValue={defaultPayment}
                    options={PAYMENT_METHODS}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-categoryId">Categoria</Label>
                  <FormSelect
                    id="new-categoryId"
                    name="categoryId"
                    defaultValue=""
                    options={[
                      { value: "", label: "Sem categoria" },
                      ...filteredCategories.map((category) => ({
                        value: category.id,
                        label: category.name,
                      })),
                    ]}
                  />
                </div>
                {showCard && (
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="new-creditCardId">Cartão (opcional)</Label>
                    <FormSelect
                      id="new-creditCardId"
                      name="creditCardId"
                      defaultValue=""
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
