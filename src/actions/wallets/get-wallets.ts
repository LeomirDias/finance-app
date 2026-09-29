"use server";

import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { walletsMembers } from "@/src/db/schema";
import { requireSession } from "@/src/lib/require-session";
import { type WalletRecord } from "@/src/actions/wallets/wallet-schema";

export async function getWalletsByUser(): Promise<WalletRecord[]> {
  const session = await requireSession();

  const memberships = await db.query.walletsMembers.findMany({
    where: eq(walletsMembers.userId, session.userId),
    with: {
      wallet: true,
    },
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });

  return memberships.map(({ wallet }) => wallet);
}
