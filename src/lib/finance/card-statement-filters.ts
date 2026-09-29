import type {
  CardStatementKind,
  CardStatementStatus,
} from "@/src/lib/finance/card-statement-types";
import {
  businessCalendarParts,
  formatYearMonth,
  parseYearMonth,
} from "@/src/lib/finance/dates";

const KIND_BY_PARAM: Record<string, CardStatementKind> = {
  gasto: "expense",
  assinatura: "subscription",
  recorrente: "recurring",
  compra: "installment",
};

export function parseCardStatementFilters(params: {
  mes?: string;
  periodo?: string;
  q?: string;
  tipo?: string;
  situacao?: string;
  categoria?: string;
}) {
  const today = businessCalendarParts();
  const parsedMonth = params.mes ? parseYearMonth(params.mes) : null;
  const month = parsedMonth
    ? formatYearMonth(parsedMonth.year, parsedMonth.month)
    : formatYearMonth(today.year, today.month);

  const kind = params.tipo ? KIND_BY_PARAM[params.tipo] : undefined;
  const status =
    params.situacao === "pendente" || params.situacao === "pago"
      ? params.situacao
      : undefined;

  return {
    month,
    allTime: params.periodo === "tudo",
    q: params.q?.trim() || undefined,
    kind,
    status: status as CardStatementStatus | undefined,
    categoryId: params.categoria?.trim() || undefined,
  };
}

export type CardStatementFilters = ReturnType<typeof parseCardStatementFilters>;
