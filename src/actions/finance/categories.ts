"use server";

import { and, eq, ne, sql } from "drizzle-orm";

import {
  CategorySchema,
  type FinanceActionState,
} from "@/src/actions/finance/finance-schema";
import { db } from "@/src/db";
import { categories } from "@/src/db/schema";
import { isUniqueViolation } from "@/src/lib/credentials-session";
import { revalidateFinance } from "@/src/lib/finance/revalidate";
import { detachCategoryFromWallet } from "@/src/lib/finance/wallet-refs";
import { requireActiveWallet } from "@/src/lib/require-active-wallet";

const duplicateNameError =
  "Já existe uma categoria com esse nome neste tipo.";

export async function getCategoryById(id: string) {
  const { walletId } = await requireActiveWallet();

  return db.query.categories.findFirst({
    where: and(eq(categories.id, id), eq(categories.walletId, walletId)),
  });
}

async function hasDuplicateName(input: {
  walletId: string;
  name: string;
  type: "income" | "expense";
  ignoreId?: string;
}) {
  const duplicate = await db.query.categories.findFirst({
    where: and(
      eq(categories.walletId, input.walletId),
      eq(categories.type, input.type),
      sql`lower(${categories.name}) = ${input.name.toLowerCase()}`,
      input.ignoreId ? ne(categories.id, input.ignoreId) : undefined,
    ),
  });

  return Boolean(duplicate);
}

export async function upsertCategoryAction(
  _prevState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const { walletId } = await requireActiveWallet();

  const parsed = CategorySchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    type: formData.get("type"),
    icon: String(formData.get("icon") ?? ""),
    color: String(formData.get("color") ?? ""),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  if (
    await hasDuplicateName({
      walletId,
      name: data.name,
      type: data.type,
      ignoreId: data.id,
    })
  ) {
    return { error: duplicateNameError };
  }

  try {
    if (data.id) {
      const existing = await db.query.categories.findFirst({
        where: and(
          eq(categories.id, data.id),
          eq(categories.walletId, walletId),
        ),
      });

      if (!existing) {
        return { error: "Categoria não encontrada." };
      }

      await db
        .update(categories)
        .set({
          name: data.name,
          type: data.type,
          icon: data.icon ?? null,
          color: data.color ?? null,
          updatedAt: new Date(),
        })
        .where(eq(categories.id, data.id));

      revalidateFinance();
      return { success: true, data: { id: data.id } };
    }

    const [created] = await db
      .insert(categories)
      .values({
        walletId,
        name: data.name,
        type: data.type,
        icon: data.icon ?? null,
        color: data.color ?? null,
      })
      .returning({ id: categories.id });

    revalidateFinance();
    return { success: true, data: { id: created!.id } };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: duplicateNameError };
    }

    throw error;
  }
}

export async function deleteCategoryAction(
  _prevState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const { walletId } = await requireActiveWallet();
  const id = String(formData.get("id") ?? "");

  if (!id) return { error: "Categoria inválida." };

  const existing = await db.query.categories.findFirst({
    where: and(eq(categories.id, id), eq(categories.walletId, walletId)),
  });

  if (!existing) return { error: "Categoria não encontrada." };

  await detachCategoryFromWallet(walletId, id);
  await db
    .delete(categories)
    .where(and(eq(categories.id, id), eq(categories.walletId, walletId)));

  revalidateFinance();
  return { success: true, data: { id } };
}
