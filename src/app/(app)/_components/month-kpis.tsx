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
    <div className="min-w-0 rounded-2xl border border-border/60 px-4 py-4 sm:px-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={`mt-1 text-xl font-semibold tabular-nums sm:text-2xl ${toneClass}`}>
        {formatCurrency(planned)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Realizado{" "}
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
    <section className="mb-8 grid gap-4 sm:grid-cols-3">
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
