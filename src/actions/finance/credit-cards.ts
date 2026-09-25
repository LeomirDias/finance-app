"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/src/db";
import { creditCards } from "@/src/db/schema";
import {
  CreditCardSchema,
  type FinanceActionState,
} from "@/src/actions/finance/finance-schema";
import { requireActiveWallet } from "@/src/lib/require-active-wallet";

export async function listCreditCards() {
  const { walletId } = await requireActiveWallet();

  return db.query.creditCards.findMany({
    where: eq(creditCards.walletId, walletId),
    orderBy: (table, { asc }) => [asc(table.name)],
  });
}

export async function upsertCreditCardAction(
  _prevState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const { walletId } = await requireActiveWallet();

  const parsed = CreditCardSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    institution: formData.get("institution") || undefined,
    status: formData.get("status") || "active",
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  if (data.id) {
    const existing = await db.query.creditCards.findFirst({
      where: and(
        eq(creditCards.id, data.id),
        eq(creditCards.walletId, walletId),
      ),
    });

    if (!existing) {
      return { error: "Cartão não encontrado." };
    }

    await db
      .update(creditCards)
      .set({
        name: data.name,
        institution: data.institution ?? null,
        status: data.status,
        updatedAt: new Date(),
      })
      .where(eq(creditCards.id, data.id));

    revalidatePath("/cartoes");
    revalidatePath("/lancamentos");
    revalidatePath("/");
    return { success: true, data: { id: data.id } };
  }

  const [created] = await db
    .insert(creditCards)
    .values({
      walletId,
      name: data.name,
      institution: data.institution ?? null,
      status: data.status,
    })
    .returning({ id: creditCards.id });

  revalidatePath("/cartoes");
  revalidatePath("/lancamentos");
  revalidatePath("/");
  return { success: true, data: { id: created!.id } };
}

export async function deleteCreditCardAction(
  _prevState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const { walletId } = await requireActiveWallet();
  const id = String(formData.get("id") ?? "");

  if (!id) return { error: "Cartão inválido." };

  const existing = await db.query.creditCards.findFirst({
    where: and(eq(creditCards.id, id), eq(creditCards.walletId, walletId)),
  });

  if (!existing) return { error: "Cartão não encontrado." };

  await db.delete(creditCards).where(eq(creditCards.id, id));

  revalidatePath("/cartoes");
  revalidatePath("/lancamentos");
  revalidatePath("/");
  return { success: true, data: { id } };
}
