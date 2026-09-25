import { z } from "zod";

export type WalletActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
  data?: { id: string };
};

export const WalletSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Informe o nome da carteira."),
  status: z.enum(["active", "inactive", "blocked"]),
});

export const WalletMemberSchema = z
  .object({
    walletId: z.string().min(1, "Informe a carteira."),
    userId: z.string().optional(),
    email: z
      .string()
      .email("Informe um e-mail válido.")
      .optional()
      .or(z.literal("")),
  })
  .refine((data) => data.userId || (data.email && data.email.length > 0), {
    message: "Informe o e-mail do membro.",
    path: ["email"],
  });

export const DeleteWalletSchema = z.object({
  id: z.string().min(1, "Informe a carteira."),
});

export const DeleteWalletMemberSchema = z.object({
  id: z.string().min(1, "Informe o membro."),
});

export const SwitchWalletSchema = z.object({
  walletId: z.string().min(1, "Informe a carteira."),
});

export const GetWalletsByUserSchema = z.object({
  userId: z.string().min(1, "Informe o usuário."),
});

export type WalletInput = z.infer<typeof WalletSchema>;
export type WalletMemberInput = z.infer<typeof WalletMemberSchema>;

export type WalletRecord = {
  id: string;
  name: string;
  status: "active" | "inactive" | "blocked";
  createdAt: Date;
  updatedAt: Date;
};
