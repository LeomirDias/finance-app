"use server";

import { eq } from "drizzle-orm";

import { auth } from "@/src/auth";
import { db } from "@/src/db";
import { walletsMembers } from "@/src/db/schema";
import {
  GetWalletsByUserSchema,
  type WalletRecord,
} from "@/src/actions/wallets/wallet-schema";

export async function getAllWallets(): Promise<WalletRecord[]> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Você precisa estar autenticado.");
  }

  return db.query.wallets.findMany({
    orderBy: (table, { desc }) => [desc(table.createdAt)],
  });
}

export async function getWalletsByUser(userId: string): Promise<WalletRecord[]> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Você precisa estar autenticado.");
  }

  const parsed = GetWalletsByUserSchema.safeParse({ userId });

  if (!parsed.success) {
    throw new Error(parsed.error.flatten().fieldErrors.userId?.[0]);
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
