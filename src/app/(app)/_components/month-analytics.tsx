import type {
  ExpenseNature,
  NatureBreakdown,
  TopExpense,
} from "@/src/lib/finance/month-summary";
import { formatCurrency } from "@/src/lib/helpers/format";
import { cn } from "@/src/lib/utils";

const PAYMENT_LABELS: Record<string, string> = {
  pix: "Pix",
  credit_card: "Crédito",
  debit_card: "Débito",
  bank_transfer: "Transferência",
  cash: "Dinheiro",
};

const BAR_COLORS = [
  "bg-primary",
  "bg-chart-1",
  "bg-chart-3",
  "bg-chart-2",
  "bg-chart-4",
  "bg-chart-5",
];

const NATURE_META: Record<
  ExpenseNature,
  { label: string; bar: string; dot: string }
> = {
  one_off: { label: "Avulsos", bar: "bg-primary", dot: "bg-primary" },
  subscription: { label: "Assinaturas", bar: "bg-chart-1", dot: "bg-chart-1" },
  recurring: { label: "Recorrentes", bar: "bg-chart-3", dot: "bg-chart-3" },
  installment: { label: "Parcelas", bar: "bg-chart-2", dot: "bg-chart-2" },
};

function formatShare(amount: number, total: number) {
  if (total <= 0) return "0%";
  return `${Math.round((amount / total) * 100)}%`;
}

function panel(className?: string) {
  return cn(
    "flex h-full min-w-0 flex-col rounded-2xl border border-border/60 p-4 sm:p-5",
    className,
  );
}

type BreakdownItem = { name: string; amount: number };

function HorizontalBars({
  title,
  items,
  emptyLabel,
  className,
}: {
  title: string;
  items: BreakdownItem[];
  emptyLabel: string;
  className?: string;
}) {
  const max = Math.max(...items.map((i) => i.amount), 1);

  return (
    <section className={panel(className)}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.slice(0, 8).map((item, index) => {
            const pct = Math.max((item.amount / max) * 100, 4);
            return (
              <li key={`${item.name}-${index}`}>
                <div className="mb-1 flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium">{item.name}</span>
                  <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${BAR_COLORS[index % BAR_COLORS.length]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function DailyChart({
  days,
  daysInMonth,
  className,
}: {
  days: { day: number; amount: number; count: number }[];
  daysInMonth: number;
  className?: string;
}) {
  const max = Math.max(...days.map((d) => d.amount), 1);
  const dayLookup = new Map(days.map((d) => [d.day, d]));
  const range = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <section className={panel(className)}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Gastos por dia
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Apenas gastos avulsos (sem parcelas, recorrências ou assinaturas)
      </p>
      {days.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Sem gastos registrados neste mês.
        </p>
      ) : (
        <div className="mt-4 flex min-h-36 flex-1 items-end gap-px overflow-x-auto pb-1 sm:mt-5 sm:min-h-40 sm:gap-1.5">
          {range.map((day) => {
            const entry = dayLookup.get(day);
            const amount = entry?.amount ?? 0;
            const height = amount > 0 ? Math.max((amount / max) * 100, 6) : 2;
            const showLabel = day === 1 || day === daysInMonth || day % 5 === 0;
            return (
              <div
                key={day}
                className="group flex min-w-1.5 flex-1 flex-col items-center gap-1 sm:min-w-0"
                title={
                  amount > 0
                    ? `Dia ${day}: ${formatCurrency(amount)}`
                    : `Dia ${day}: sem gastos`
                }
              >
                <div className="flex h-24 w-full items-end justify-center sm:h-28">
                  <div
                    className={`w-full max-w-3 rounded-t-sm transition-opacity ${
                      amount > 0
                        ? "bg-primary/80 group-hover:bg-primary"
                        : "bg-muted"
                    }`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "text-[9px] tabular-nums text-muted-foreground sm:text-[10px]",
                    !showLabel && "invisible sm:visible",
                  )}
                >
                  {day}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function WeekdayChart({
  weekdays,
  className,
}: {
  weekdays: { weekday: number; label: string; amount: number }[];
  className?: string;
}) {
  const max = Math.max(...weekdays.map((w) => w.amount), 1);

  return (
    <section className={panel(className)}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Gastos por dia da semana
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Apenas gastos avulsos
      </p>
      <div className="mt-5 flex min-h-36 flex-1 items-end justify-between gap-1.5 sm:gap-2">
        {weekdays.map((w) => {
          const height = w.amount > 0 ? Math.max((w.amount / max) * 100, 8) : 3;
          return (
            <div
              key={w.weekday}
              className="flex flex-1 flex-col items-center gap-2"
              title={`${w.label}: ${formatCurrency(w.amount)}`}
            >
              <div className="flex h-24 w-full items-end justify-center">
                <div
                  className={`w-full max-w-8 rounded-t-md ${
                    w.amount > 0 ? "bg-chart-3" : "bg-muted"
                  }`}
                  style={{ height: `${height}%` }}
                />
              </div>
              <span className="text-xs font-medium text-muted-foreground">
                {w.label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PeakDays({
  peaks,
  className,
}: {
  peaks: { day: number; amount: number; count: number }[];
  className?: string;
}) {
  return (
    <section className={panel(className)}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Dias de pico
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Apenas gastos avulsos
      </p>
      {peaks.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Ainda não há picos de gasto neste mês.
        </p>
      ) : (
        <ol className="mt-4 space-y-3">
          {peaks.map((peak, index) => (
            <li
              key={peak.day}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-xs font-semibold text-primary-light">
                  {index + 1}
                </span>
                <div>
                  <p className="text-sm font-medium">Dia {peak.day}</p>
                  <p className="text-xs text-muted-foreground">
                    {peak.count}{" "}
                    {peak.count === 1 ? "lançamento" : "lançamentos"}
                  </p>
                </div>
              </div>
              <span className="text-sm font-semibold tabular-nums text-rose-400">
                {formatCurrency(peak.amount)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function ExpenseMix({
  items,
  className,
}: {
  items: NatureBreakdown[];
  className?: string;
}) {
  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const visible = items.filter((item) => item.amount > 0);

  return (
    <section className={panel(className)}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Composição dos gastos
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Participação de avulsos, assinaturas, recorrentes e parcelas
      </p>
      {total <= 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Nenhum gasto planejado neste mês.
        </p>
      ) : (
        <>
          <div
            className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted"
            role="img"
            aria-label="Distribuição dos gastos do mês"
          >
            {visible.map((item) => (
              <div
                key={item.nature}
                className={`h-full shrink-0 ${NATURE_META[item.nature].bar}`}
                style={{ width: `${(item.amount / total) * 100}%` }}
                title={`${NATURE_META[item.nature].label}: ${formatCurrency(item.amount)}`}
              />
            ))}
          </div>
          <ul className="mt-4 space-y-3">
            {items.map((item) => {
              const meta = NATURE_META[item.nature];
              return (
                <li
                  key={item.nature}
                  className="flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`size-2.5 shrink-0 rounded-full ${meta.dot}`} />
                      <span className="truncate text-sm font-medium">{meta.label}</span>
                    </div>
                    <p className="mt-0.5 pl-4 text-xs text-muted-foreground">
                      {item.count}{" "}
                      {item.count === 1 ? "lançamento" : "lançamentos"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatCurrency(item.amount)}
                    </p>
                    <p className="text-xs tabular-nums text-muted-foreground">
                      {formatShare(item.amount, total)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

export function IncomeCommitment({
  plannedIncome,
  fixedExpense,
  variableExpense,
  plannedBalance,
  className,
}: {
  plannedIncome: number;
  fixedExpense: number;
  variableExpense: number;
  plannedBalance: number;
  className?: string;
}) {
  const totalExpense = fixedExpense + variableExpense;
  const scale = Math.max(plannedIncome, totalExpense, 1);
  const hasIncome = plannedIncome > 0;
  const commitmentPct = hasIncome
    ? Math.round((fixedExpense / plannedIncome) * 100)
    : null;
  const savingsPct = hasIncome
    ? Math.round((plannedBalance / plannedIncome) * 100)
    : null;

  return (
    <section className={panel(className)}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Comprometimento da renda
      </h3>
      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)] md:items-center md:gap-8">
      <div className="space-y-3">
        <div>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
            <span className="text-muted-foreground">Renda</span>
            <span className="font-medium tabular-nums text-emerald-400">
              {formatCurrency(plannedIncome)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-400"
              style={{ width: `${(plannedIncome / scale) * 100}%` }}
            />
          </div>
        </div>
        <div>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
            <span className="text-muted-foreground">Gastos</span>
            <span className="font-medium tabular-nums text-rose-400">
              {formatCurrency(totalExpense)}
            </span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full shrink-0 bg-chart-4"
              style={{ width: `${(fixedExpense / scale) * 100}%` }}
              title={`Fixos: ${formatCurrency(fixedExpense)}`}
            />
            <div
              className="h-full shrink-0 bg-primary"
              style={{ width: `${(variableExpense / scale) * 100}%` }}
              title={`Variáveis: ${formatCurrency(variableExpense)}`}
            />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-chart-4" />
              Fixos {formatCurrency(fixedExpense)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-primary" />
              Variáveis {formatCurrency(variableExpense)}
            </span>
          </div>
        </div>
      </div>

      <div className="md:pb-0.5">
      <p className="text-sm text-muted-foreground">
        {commitmentPct == null
          ? "Cadastre ganhos para medir quanto da renda já está comprometida."
          : `${commitmentPct}% da renda está em gastos fixos (assinaturas, recorrentes e parcelas).`}
      </p>
      {savingsPct != null ? (
        <p
          className={cn(
            "mt-1 text-sm font-medium tabular-nums",
            plannedBalance >= 0 ? "text-emerald-400" : "text-rose-400",
          )}
        >
          {plannedBalance >= 0
            ? `Folga de ${formatCurrency(plannedBalance)} (${savingsPct}% da renda)`
            : `Déficit de ${formatCurrency(Math.abs(plannedBalance))} (${Math.abs(savingsPct)}% da renda)`}
        </p>
      ) : null}
      </div>
      </div>
    </section>
  );
}

function TopExpenses({
  items,
  className,
}: {
  items: TopExpense[];
  className?: string;
}) {
  return (
    <section className={panel(className)}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Maiores gastos
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Os cinco lançamentos de maior valor no mês
      </p>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Nenhum gasto planejado neste mês.
        </p>
      ) : (
        <ol className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {items.map((item, index) => (
            <li
              key={`${item.source}-${item.id}`}
              className="flex min-w-0 items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2.5 sm:items-start xl:flex-col"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-xs font-semibold text-primary-light">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.description}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {NATURE_META[item.nature].label}
                    {item.categoryName ? ` · ${item.categoryName}` : ""}
                  </p>
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-rose-400 xl:pl-11">
                {formatCurrency(item.amount)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export type MonthAnalyticsProps = {
  year: number;
  month: number;
  byCategory: { id: string | null; name: string; amount: number }[];
  byCard: { id: string | null; name: string; amount: number }[];
  byPaymentMethod: { method: string; amount: number }[];
  byDay: { day: number; amount: number; count: number }[];
  byWeekday: { weekday: number; label: string; amount: number }[];
  peakDays: { day: number; amount: number; count: number }[];
  byNature: NatureBreakdown[];
  topExpenses: TopExpense[];
};

export function MonthAnalytics(props: MonthAnalyticsProps) {
  const daysInMonth = new Date(props.year, props.month, 0).getDate();

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-12">
      <DailyChart
        className="md:col-span-2 xl:order-1 xl:col-span-8"
        days={props.byDay}
        daysInMonth={daysInMonth}
      />
      <WeekdayChart
        className="xl:order-2 xl:col-span-4"
        weekdays={props.byWeekday}
      />
      <PeakDays className="xl:order-7 xl:col-span-6" peaks={props.peakDays} />
      <HorizontalBars
        className="xl:order-3 xl:col-span-4"
        title="Gastos por categoria"
        items={props.byCategory.map((c) => ({
          name: c.name,
          amount: c.amount,
        }))}
        emptyLabel="Nenhum gasto categorizado neste mês."
      />
      <HorizontalBars
        className="xl:order-4 xl:col-span-4"
        title="Gastos por cartão"
        items={props.byCard.map((c) => ({
          name: c.name,
          amount: c.amount,
        }))}
        emptyLabel="Nenhum gasto em cartão neste mês."
      />
      <HorizontalBars
        className="xl:order-5 xl:col-span-4"
        title="Por forma de pagamento"
        items={props.byPaymentMethod.map((p) => ({
          name: PAYMENT_LABELS[p.method] ?? p.method,
          amount: p.amount,
        }))}
        emptyLabel="Sem pagamentos registrados."
      />
      <ExpenseMix className="xl:order-6 xl:col-span-6" items={props.byNature} />
      <TopExpenses
        className="md:col-span-2 xl:order-9 xl:col-span-12"
        items={props.topExpenses}
      />
    </div>
  );
}
