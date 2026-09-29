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

const paymentMethodSchema = z.enum([
  "credit_card",
  "debit_card",
  "pix",
  "bank_transfer",
  "cash",
]);

export const IncomeSchema = z.object({
  id: optionalId,
  description: z.string().min(1, "Informe a descrição."),
  amount: moneySchema,
  status: z.enum(["pending", "received", "canceled"]),
  paymentMethod: paymentMethodSchema,
  categoryId: optionalId,
  transactionDate: z.string().min(1, "Informe a data."),
  notes: z.string().optional(),
});

export const ExpenseSchema = z.object({
  id: optionalId,
  description: z.string().min(1, "Informe a descrição."),
  amount: moneySchema,
  status: z.enum(["pending", "paid", "canceled"]).optional(),
  paymentMethod: paymentMethodSchema,
  categoryId: optionalId,
  creditCardId: optionalId,
  transactionDate: z
    .string()
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
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
  paymentMethod: paymentMethodSchema,
  categoryId: optionalId,
  creditCardId: optionalId,
  notes: z.string().optional(),
});

export const PlanSchema = z.object({
  id: optionalId,
  description: z.string().min(1, "Informe a descrição."),
  amount: moneySchema,
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
  paymentMethod: paymentMethodSchema,
  categoryId: optionalId,
  creditCardId: optionalId,
  status: z.enum(["active", "inactive"]).default("active"),
  notes: z.string().optional(),
});

export const CategorySchema = z.object({
  id: optionalId,
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome da categoria.")
    .max(40, "Use no máximo 40 caracteres."),
  type: z.enum(["income", "expense"]),
  icon: z
    .string()
    .trim()
    .max(16, "Use um ícone curto.")
    .transform((value) => (value.length > 0 ? value : undefined)),
  color: z
    .string()
    .trim()
    .transform((value) => (value.length > 0 ? value : undefined))
    .refine(
      (value) => value === undefined || /^#[0-9A-Fa-f]{6}$/.test(value),
      "Informe uma cor válida.",
    ),
});

export const CreditCardSchema = z.object({
  id: optionalId,
  name: z.string().min(1, "Informe o nome do cartão."),
  institution: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  dueDay: z.coerce
    .number()
    .int("Informe o dia de vencimento.")
    .min(1, "Informe um dia entre 1 e 31.")
    .max(31, "Informe um dia entre 1 e 31."),
  status: z.enum(["active", "inactive", "blocked"]).default("active"),
});

export const ToggleEntryStatusSchema = z.object({
  id: z.string().min(1),
  source: z.enum([
    "income",
    "expense",
    "subscription",
    "recurring",
    "installment",
  ]),
  status: z.enum(["pending", "paid", "received", "canceled"]),
});

export const DeleteByIdSchema = z.object({
  id: z.string().min(1),
});
