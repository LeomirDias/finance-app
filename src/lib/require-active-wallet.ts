import "server-only";

import { auth } from "@/src/auth";

export async function requireActiveWallet(): Promise<{
  userId: string;
  walletId: string;
}> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error("Você precisa estar autenticado.");
  }

  if (!session.walletId) {
    throw new Error("Nenhuma carteira ativa selecionada.");
  }

  return {
    userId: session.user.id,
    walletId: session.walletId,
  };
}
