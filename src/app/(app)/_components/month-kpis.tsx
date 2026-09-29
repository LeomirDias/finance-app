import { IncomeCommitment } from "@/src/app/(app)/_components/month-analytics";
import { formatCurrency } from "@/src/lib/helpers/format";
import { cn } from "@/src/lib/utils";

type MonthKpisProps = {
  plannedIncome: number;
  plannedExpense: number;
  plannedBalance: number;
  realizedIncome: number;
  realizedExpense: number;
  realizedBalance: number;
  fixedExpense: number;
  variableExpense: number;
};

function KpiBlock({
  label,
  planned,
  realized,
  tone,
  className,
}: {
  label: string;
  planned: number;
  realized: number;
  tone: "income" | "expense" | "balance";
  className?: string;
}) {
  const toneClass =
    tone === "income"
      ? "text-emerald-400"
      : tone === "expense"
        ? "text-rose-400"
        : plannedBalanceClass(planned);

  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border border-border/60 px-3 py-3 sm:px-5 sm:py-4",
        className,
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
        {label}
      </p>
      <p
        className={`mt-1 truncate text-lg font-semibold tabular-nums leading-tight md:text-2xl ${toneClass}`}
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
    <section className="mb-3 grid grid-cols-2 gap-2 md:mb-5 md:grid-cols-6 md:gap-4">
      <KpiBlock
        className="md:col-span-2"
        label="Ganhos"
        planned={props.plannedIncome}
        realized={props.realizedIncome}
        tone="income"
      />
      <KpiBlock
        className="md:col-span-2"
        label="Gastos"
        planned={props.plannedExpense}
        realized={props.realizedExpense}
        tone="expense"
      />
      <KpiBlock
        className="col-span-2"
        label="Saldo"
        planned={props.plannedBalance}
        realized={props.realizedBalance}
        tone="balance"
      />
      <IncomeCommitment
        className="col-span-2 md:col-span-6"
        plannedIncome={props.plannedIncome}
        plannedBalance={props.plannedBalance}
        fixedExpense={props.fixedExpense}
        variableExpense={props.variableExpense}
      />
    </section>
  );
}
