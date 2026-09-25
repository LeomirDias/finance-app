import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/src/db";
import { users, walletsMembers } from "@/src/db/schema";

export async function hasWalletMembership(
  userId: string,
  walletId: string,
): Promise<boolean> {
  const membership = await db.query.walletsMembers.findFirst({
    where: and(
      eq(walletsMembers.walletId, walletId),
      eq(walletsMembers.userId, userId),
    ),
    columns: { id: true },
  });

  return !!membership;
}

export async function assertWalletMembership(
  userId: string,
  walletId: string,
): Promise<void> {
  const isMember = await hasWalletMembership(userId, walletId);

  if (!isMember) {
    throw new Error("Você não tem permissão para acessar esta carteira.");
  }
}

export async function persistActiveWallet(
  userId: string,
  walletId: string | null,
): Promise<void> {
  await db
    .update(users)
    .set({ activeWalletId: walletId })
    .where(eq(users.id, userId));
}

export async function resolveDefaultWalletId(
  userId: string,
): Promise<string | undefined> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { activeWalletId: true },
  });

  if (user?.activeWalletId) {
    const isMember = await hasWalletMembership(userId, user.activeWalletId);

    if (isMember) {
      return user.activeWalletId;
    }
  }

  const membership = await db.query.walletsMembers.findFirst({
    where: eq(walletsMembers.userId, userId),
    orderBy: (table, { desc }) => [desc(table.createdAt)],
    columns: { walletId: true },
  });

  return membership?.walletId;
}
