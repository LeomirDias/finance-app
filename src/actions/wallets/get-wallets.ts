"use server";

import { eq } from "drizzle-orm";

import { db } from "@/src/db";
import { walletsMembers } from "@/src/db/schema";
import { requireSession } from "@/src/lib/require-session";
import {
  GetWalletsByUserSchema,
  type WalletRecord,
} from "@/src/actions/wallets/wallet-schema";

export async function getAllWallets(): Promise<WalletRecord[]> {
  await requireSession();

  return db.query.wallets.findMany({
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });
}

export async function getWalletsByUser(userId: string): Promise<WalletRecord[]> {
  const session = await requireSession();

  const parsed = GetWalletsByUserSchema.safeParse({ userId });

  if (!parsed.success) {
    throw new Error(parsed.error.flatten().fieldErrors.userId?.[0]);
  }

  if (parsed.data.userId !== session.userId) {
    throw new Error("Você não tem permissão para listar estas carteiras.");
  }

  const memberships = await db.query.walletsMembers.findMany({
    where: eq(walletsMembers.userId, parsed.data.userId),
    with: {
      wallet: true,
    },
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });

  return memberships.map(({ wallet }) => wallet);
}
