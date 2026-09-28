import { z } from "zod";

export type FinanceActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  data?: { id: string };
};

const moneySchema = z.coerce
  .number()
  .positive("Informe um valor maior que zero.");

const optionalId = z
  .string()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const TransactionSchema = z.object({
  id: optionalId,
  description: z.string().min(1, "Informe a descrição."),
  amount: moneySchema,
  type: z.enum(["income", "expense"]),
  status: z.enum(["pending", "paid", "received", "canceled"]),
  paymentMethod: z.enum([
    "credit_card",
    "debit_card",
    "pix",
    "bank_transfer",
    "cash",
  ]),
  categoryId: optionalId,
  creditCardId: optionalId,
  transactionDate: z.string().min(1, "Informe a data."),
  notes: z.string().optional(),
});

export const InstallmentPlanSchema = z.object({
  description: z.string().min(1, "Informe a descrição."),
  installmentAmount: moneySchema,
  totalInstallments: z.coerce
    .number()
    .int()
    .min(2, "Mínimo de 2 parcelas.")
    .max(60, "Máximo de 60 parcelas."),
  firstDueDate: z.string().min(1, "Informe a data da 1ª parcela."),
  paymentMethod: z.enum([
    "credit_card",
    "debit_card",
    "pix",
    "bank_transfer",
    "cash",
  ]),
  categoryId: optionalId,
  creditCardId: optionalId,
  notes: z.string().optional(),
});

export const RecurrentSchema = z.object({
  id: optionalId,
  description: z.string().min(1, "Informe a descrição."),
  amount: moneySchema,
  recurrenceKind: z.enum([
    "subscription",
    "recurring_expense",
    "fixed_income",
  ]),
  dayOfMonth: z.coerce
    .number()
    .int()
    .min(1, "Dia inválido.")
    .max(31, "Dia inválido."),
  startDate: z.string().min(1, "Informe a data de início."),
  endDate: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  paymentMethod: z.enum([
    "credit_card",
    "debit_card",
    "pix",
    "bank_transfer",
    "cash",
  ]),
  categoryId: optionalId,
  creditCardId: optionalId,
  status: z.enum(["active", "inactive"]).default("active"),
  notes: z.string().optional(),
});

export const CreditCardSchema = z.object({
  id: optionalId,
  name: z.string().min(1, "Informe o nome do cartão."),
  institution: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  status: z.enum(["active", "inactive", "blocked"]).default("active"),
});

export const ToggleTransactionStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["pending", "paid", "received", "canceled"]),
});

export const DeleteByIdSchema = z.object({
  id: z.string().min(1),
});
