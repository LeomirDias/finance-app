export const STATEMENT_KINDS = [
  { id: "expense", param: "gasto", label: "Gastos", itemLabel: "Gasto" },
  {
    id: "subscription",
    param: "assinatura",
    label: "Assinaturas",
    itemLabel: "Assinatura",
  },
  {
    id: "recurring",
    param: "recorrente",
    label: "Recorrentes",
    itemLabel: "Recorrente",
  },
  { id: "installment", param: "compra", label: "Compras", itemLabel: "Compra" },
] as const;

export type CardStatementKind = (typeof STATEMENT_KINDS)[number]["id"];

export type CardStatementToggleSource =
  | "expense"
  | "subscription"
  | "recurring"
  | "installment";

export type CardStatementStatus = "pending" | "paid";

export type CardStatementItem = {
  id: string;
  entryId: string;
  source: CardStatementToggleSource;
  kind: CardStatementKind;
  description: string;
  amount: number;
  status: "pending" | "paid" | "received" | "canceled";
  occurredAt: Date;
  categoryId: string | null;
  categoryName: string | null;
  installmentNumber: number | null;
  totalInstallments: number | null;
  notes: string | null;
};

export type CardStatementPhase =
  | "open"
  | "due_today"
  | "overdue"
  | "paid"
  | "empty"
  | "all";

export type CardStatement = {
  card: {
    id: string;
    name: string;
    institution: string | null;
    dueDay: number | null;
    status: "active" | "inactive" | "blocked";
  };
  month: string;
  year: number;
  monthNumber: number;
  allTime: boolean;
  dueDate: Date | null;
  phase: CardStatementPhase;
  categories: { id: string; name: string }[];
  items: CardStatementItem[];
  invoice: {
    amount: number;
    pending: number;
    paid: number;
    count: number;
    byKind: Record<CardStatementKind, { amount: number; count: number }>;
  };
  visible: {
    amount: number;
    count: number;
  };
};
