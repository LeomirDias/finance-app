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

type BreakdownItem = { name: string; amount: number };

function HorizontalBars({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: BreakdownItem[];
  emptyLabel: string;
}) {
  const max = Math.max(...items.map((i) => i.amount), 1);

  return (
    <section className="rounded-2xl border border-border/60 p-4 sm:p-5">
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
}: {
  days: { day: number; amount: number; count: number }[];
  daysInMonth: number;
}) {
  const max = Math.max(...days.map((d) => d.amount), 1);
  const dayLookup = new Map(days.map((d) => [d.day, d]));
  const range = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <section className="rounded-2xl border border-border/60 p-4 sm:p-5 lg:col-span-2">
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
        <div className="mt-4 flex h-36 items-end gap-px overflow-x-auto pb-1 sm:mt-5 sm:h-40 sm:gap-1.5">
          {range.map((day) => {
            const entry = dayLookup.get(day);
            const amount = entry?.amount ?? 0;
            const height = amount > 0 ? Math.max((amount / max) * 100, 6) : 2;
            const showLabel = day === 1 || day === daysInMonth || day % 5 === 0;
            return (
              <div
                key={day}
                className="group flex min-w-[6px] flex-1 flex-col items-center gap-1 sm:min-w-0"
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
}: {
  weekdays: { weekday: number; label: string; amount: number }[];
}) {
  const max = Math.max(...weekdays.map((w) => w.amount), 1);

  return (
    <section className="rounded-2xl border border-border/60 p-4 sm:p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Gastos por dia da semana
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Apenas gastos avulsos
      </p>
      <div className="mt-5 flex h-36 items-end justify-between gap-2">
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
}: {
  peaks: { day: number; amount: number; count: number }[];
}) {
  return (
    <section className="rounded-2xl border border-border/60 p-4 sm:p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Dias de pico
      </h3>
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

function InsightCards({
  pendingCount,
  paidCount,
  avgDailyExpense,
  realizedExpense,
  plannedExpense,
}: {
  pendingCount: number;
  paidCount: number;
  avgDailyExpense: number;
  realizedExpense: number;
  plannedExpense: number;
}) {
  const realizationPct =
    plannedExpense > 0
      ? Math.min(Math.round((realizedExpense / plannedExpense) * 100), 999)
      : 0;

  const cards = [
    {
      label: "Pendentes",
      value: String(pendingCount),
      hint: "aguardando pagamento",
    },
    {
      label: "Quitados",
      value: String(paidCount),
      hint: "pagos ou recebidos",
    },
    {
      label: "Média diária",
      value: formatCurrency(avgDailyExpense),
      hint: "gasto planejado / dia",
    },
    {
      label: "Realização",
      value: `${realizationPct}%`,
      hint: "gastos realizados vs planejados",
    },
  ];

  return (
    <section className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-border/60 px-3 py-3 sm:px-4 sm:py-4"
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
            {card.label}
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums sm:text-xl">
            {card.value}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
            {card.hint}
          </p>
        </div>
      ))}
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
  pendingCount: number;
  paidCount: number;
  avgDailyExpense: number;
  realizedExpense: number;
  plannedExpense: number;
};

export function MonthAnalytics(props: MonthAnalyticsProps) {
  const daysInMonth = new Date(props.year, props.month, 0).getDate();

  return (
    <div className="mb-6 space-y-3 sm:mb-10 sm:space-y-5">
      <InsightCards
        pendingCount={props.pendingCount}
        paidCount={props.paidCount}
        avgDailyExpense={props.avgDailyExpense}
        realizedExpense={props.realizedExpense}
        plannedExpense={props.plannedExpense}
      />

      <div className="grid gap-3 sm:gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <DailyChart days={props.byDay} daysInMonth={daysInMonth} />
        <WeekdayChart weekdays={props.byWeekday} />
      </div>

      <div className="grid gap-3 sm:gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <HorizontalBars
          title="Gastos por categoria"
          items={props.byCategory.map((c) => ({
            name: c.name,
            amount: c.amount,
          }))}
          emptyLabel="Nenhum gasto categorizado neste mês."
        />
        <HorizontalBars
          title="Gastos por cartão"
          items={props.byCard.map((c) => ({
            name: c.name,
            amount: c.amount,
          }))}
          emptyLabel="Nenhum gasto em cartão neste mês."
        />
        <div className="space-y-3 sm:space-y-5">
          <HorizontalBars
            title="Por forma de pagamento"
            items={props.byPaymentMethod.map((p) => ({
              name: PAYMENT_LABELS[p.method] ?? p.method,
              amount: p.amount,
            }))}
            emptyLabel="Sem pagamentos registrados."
          />
          <PeakDays peaks={props.peakDays} />
        </div>
      </div>
    </div>
  );
}
