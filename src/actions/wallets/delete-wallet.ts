"use server";

import { and, eq } from "drizzle-orm";

import { auth, unstable_update } from "@/src/auth";
import { db } from "@/src/db";
import { wallets, walletsMembers } from "@/src/db/schema";
import { resolveDefaultWalletId } from "@/src/lib/wallet-session";
import {
  DeleteWalletSchema,
  type WalletActionState,
} from "@/src/actions/wallets/wallet-schema";

export async function deleteWalletAction(
  _prevState: WalletActionState,
  formData: FormData,
): Promise<WalletActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Você precisa estar autenticado." };
  }

  const parsed = DeleteWalletSchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { id } = parsed.data;

  const membership = await db.query.walletsMembers.findFirst({
    where: and(
      eq(walletsMembers.walletId, id),
      eq(walletsMembers.userId, session.user.id),
    ),
  });

  if (!membership) {
    return { error: "Você não tem permissão para excluir esta carteira." };
  }

  const [deleted] = await db
    .delete(wallets)
    .where(eq(wallets.id, id))
    .returning({ id: wallets.id });

  if (!deleted) {
    return { error: "Carteira não encontrada." };
  }

  if (session.walletId === id) {
    const nextWalletId = await resolveDefaultWalletId(session.user.id);
    await unstable_update({ walletId: nextWalletId });
  }

  return { success: true, data: { id: deleted.id } };
}
