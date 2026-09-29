import "server-only";

import { redirect } from "next/navigation";

import { requireSession } from "@/src/lib/require-session";

export async function requireActiveWallet(): Promise<{
  userId: string;
  walletId: string;
}> {
  const session = await requireSession();

  if (!session.walletId) {
    redirect("/wallets/select");
  }

  return {
    userId: session.userId,
    walletId: session.walletId,
  };
}
