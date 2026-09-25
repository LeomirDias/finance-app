import { categories } from "@/src/db/schema";
import { db } from "@/src/db";

export const DEFAULT_CATEGORIES = [
  { name: "Salário", type: "income" as const },
  { name: "Outros ganhos", type: "income" as const },
  { name: "Moradia", type: "expense" as const },
  { name: "Alimentação", type: "expense" as const },
  { name: "Transporte", type: "expense" as const },
  { name: "Lazer", type: "expense" as const },
  { name: "Saúde", type: "expense" as const },
  { name: "Assinaturas", type: "expense" as const },
  { name: "Outros", type: "expense" as const },
] as const;

export async function seedWalletCategories(walletId: string) {
  await db.insert(categories).values(
    DEFAULT_CATEGORIES.map((category) => ({
      walletId,
      name: category.name,
      type: category.type,
    })),
  );
}
