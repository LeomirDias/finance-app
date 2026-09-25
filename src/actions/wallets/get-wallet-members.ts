"use server";

import { eq } from "drizzle-orm";

import { auth } from "@/src/auth";
import { db } from "@/src/db";
import { walletsMembers } from "@/src/db/schema";
import { assertWalletMembership } from "@/src/lib/wallet-session";

export type WalletMemberRecord = {
  id: string;
  userId: string;
  name: string | null;
  email: string;
};

export async function getWalletMembers(
  walletId: string,
): Promise<WalletMemberRecord[]> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Você precisa estar autenticado.");
  }

  await assertWalletMembership(session.user.id, walletId);

  const members = await db.query.walletsMembers.findMany({
    where: eq(walletsMembers.walletId, walletId),
    with: {
      user: true,
    },
    orderBy: (table, { asc }) => [asc(table.createdAt)],
  });

  return members.map((member) => ({
    id: member.id,
    userId: member.userId,
    name: member.user.name,
    email: member.user.email,
  }));
}
