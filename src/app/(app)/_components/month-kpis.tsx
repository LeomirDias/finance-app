import { formatCurrency } from "@/src/lib/helpers/format";

type MonthKpisProps = {
  plannedIncome: number;
  plannedExpense: number;
  plannedBalance: number;
  realizedIncome: number;
  realizedExpense: number;
  realizedBalance: number;
};

function KpiBlock({
  label,
  planned,
  realized,
  tone,
}: {
  label: string;
  planned: number;
  realized: number;
  tone: "income" | "expense" | "balance";
}) {
  const toneClass =
    tone === "income"
      ? "text-emerald-400"
      : tone === "expense"
        ? "text-rose-400"
        : plannedBalanceClass(planned);

  return (
    <div className="min-w-0 rounded-2xl border border-border/60 px-3 py-3 sm:px-5 sm:py-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
        {label}
      </p>
      <p
        className={`mt-1 truncate text-base font-semibold tabular-nums leading-tight sm:text-2xl ${toneClass}`}
      >
        {formatCurrency(planned)}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground sm:text-xs">
        Real.{" "}
        <span className="font-medium text-foreground/80">
          {formatCurrency(realized)}
        </span>
      </p>
    </div>
  );
}

function plannedBalanceClass(value: number) {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-rose-400";
  return "text-foreground";
}

export function MonthKpis(props: MonthKpisProps) {
  return (
    <section className="mb-5 grid grid-cols-3 gap-2 sm:mb-8 sm:gap-4">
      <KpiBlock
        label="Ganhos"
        planned={props.plannedIncome}
        realized={props.realizedIncome}
        tone="income"
      />
      <KpiBlock
        label="Gastos"
        planned={props.plannedExpense}
        realized={props.realizedExpense}
        tone="expense"
      />
      <KpiBlock
        label="Saldo"
        planned={props.plannedBalance}
        realized={props.realizedBalance}
        tone="balance"
      />
    </section>
  );
}
