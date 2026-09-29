"use server";

import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { requireSession } from "@/src/lib/require-session";
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
  const session = await requireSession();

  await assertWalletMembership(session.userId, walletId);

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
