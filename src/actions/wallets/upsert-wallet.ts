"use server";

import { and, eq } from "drizzle-orm";

import { auth, unstable_update } from "@/src/auth";
import { db } from "@/src/db";
import { wallets, walletsMembers } from "@/src/db/schema";
import {
  WalletSchema,
  type WalletActionState,
} from "@/src/actions/wallets/wallet-schema";
import { seedWalletCategories } from "@/src/lib/finance/seed-categories";

export async function upsertWalletAction(
  _prevState: WalletActionState,
  formData: FormData,
): Promise<WalletActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Você precisa estar autenticado." };
  }

  const rawId = formData.get("id");
  const parsed = WalletSchema.safeParse({
    id: rawId ? String(rawId) : undefined,
    name: formData.get("name"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { id, name, status } = parsed.data;

  if (id) {
    const membership = await db.query.walletsMembers.findFirst({
      where: and(
        eq(walletsMembers.walletId, id),
        eq(walletsMembers.userId, session.user.id),
      ),
    });

    if (!membership) {
      return { error: "Você não tem permissão para editar esta carteira." };
    }

    const [updated] = await db
      .update(wallets)
      .set({ name, status, updatedAt: new Date() })
      .where(eq(wallets.id, id))
      .returning({ id: wallets.id });

    if (!updated) {
      return { error: "Carteira não encontrada." };
    }

    return { success: true, data: { id: updated.id } };
  }

  const [wallet] = await db
    .insert(wallets)
    .values({ name, status })
    .returning({ id: wallets.id });

  if (!wallet) {
    return { error: "Não foi possível criar a carteira." };
  }

  try {
    await db.insert(walletsMembers).values({
      walletId: wallet.id,
      userId: session.user.id,
    });
    await seedWalletCategories(wallet.id);
  } catch {
    await db.delete(wallets).where(eq(wallets.id, wallet.id));
    return { error: "Não foi possível criar a carteira." };
  }

  await unstable_update({ walletId: wallet.id });

  return { success: true, data: { id: wallet.id } };
}
