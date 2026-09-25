"use server";

import { and, eq } from "drizzle-orm";

import { auth } from "@/src/auth";
import { db } from "@/src/db";
import { users, walletsMembers } from "@/src/db/schema";
import {
  WalletMemberSchema,
  type WalletActionState,
} from "@/src/actions/wallets/wallet-schema";

export async function upsertWalletMemberAction(
  _prevState: WalletActionState,
  formData: FormData,
): Promise<WalletActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Você precisa estar autenticado." };
  }

  const rawEmail = formData.get("email");
  const rawUserId = formData.get("userId");

  const parsed = WalletMemberSchema.safeParse({
    walletId: formData.get("walletId"),
    userId: rawUserId ? String(rawUserId) : undefined,
    email: rawEmail ? String(rawEmail) : undefined,
  });

  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { walletId } = parsed.data;
  let { userId } = parsed.data;
  const email = parsed.data.email?.trim();

  const membership = await db.query.walletsMembers.findFirst({
    where: and(
      eq(walletsMembers.walletId, walletId),
      eq(walletsMembers.userId, session.user.id),
    ),
  });

  if (!membership) {
    return {
      error: "Você não tem permissão para gerenciar membros desta carteira.",
    };
  }

  if (!userId && email) {
    const targetUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!targetUser) {
      return {
        fieldErrors: {
          email: ["Usuário não encontrado com este e-mail."],
        },
      };
    }

    userId = targetUser.id;
  }

  if (!userId) {
    return {
      fieldErrors: {
        email: ["Informe o e-mail do membro."],
      },
    };
  }

  const targetUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!targetUser) {
    return {
      fieldErrors: {
        userId: ["Usuário não encontrado."],
      },
    };
  }

  const existing = await db.query.walletsMembers.findFirst({
    where: and(
      eq(walletsMembers.walletId, walletId),
      eq(walletsMembers.userId, userId),
    ),
  });

  if (existing) {
    return { success: true, data: { id: existing.id } };
  }

  const [created] = await db
    .insert(walletsMembers)
    .values({ walletId, userId })
    .returning({ id: walletsMembers.id });

  return { success: true, data: { id: created.id } };
}
