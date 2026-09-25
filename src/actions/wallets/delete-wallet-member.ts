"use server";

import { and, eq } from "drizzle-orm";

import { auth, unstable_update } from "@/src/auth";
import { db } from "@/src/db";
import { walletsMembers } from "@/src/db/schema";
import { resolveDefaultWalletId } from "@/src/lib/wallet-session";
import {
  DeleteWalletMemberSchema,
  type WalletActionState,
} from "@/src/actions/wallets/wallet-schema";

export async function deleteWalletMemberAction(
  _prevState: WalletActionState,
  formData: FormData,
): Promise<WalletActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Você precisa estar autenticado." };
  }

  const parsed = DeleteWalletMemberSchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { id } = parsed.data;

  const member = await db.query.walletsMembers.findFirst({
    where: eq(walletsMembers.id, id),
  });

  if (!member) {
    return { error: "Membro não encontrado." };
  }

  const membership = await db.query.walletsMembers.findFirst({
    where: and(
      eq(walletsMembers.walletId, member.walletId),
      eq(walletsMembers.userId, session.user.id),
    ),
  });

  if (!membership) {
    return {
      error: "Você não tem permissão para remover membros desta carteira.",
    };
  }

  const [deleted] = await db
    .delete(walletsMembers)
    .where(eq(walletsMembers.id, id))
    .returning({ id: walletsMembers.id });

  if (
    member.userId === session.user.id &&
    session.walletId === member.walletId
  ) {
    const nextWalletId = await resolveDefaultWalletId(session.user.id);
    await unstable_update({ walletId: nextWalletId });
  }

  return { success: true, data: { id: deleted.id } };
}
