import { redirect } from "next/navigation";

import { getWalletsByUser } from "@/src/actions/wallets/get-wallets";
import { requireSession } from "@/src/lib/require-session";
import { Logo } from "@/src/components/global/logo";
import { WalletForm } from "@/src/app/(app)/wallets/_components/wallet-form";
import { WalletSelectList } from "@/src/app/(app)/wallets/_components/wallet-select-list";

export default async function WalletSelectPage() {
  const session = await requireSession();

  if (session.walletId) {
    redirect("/");
  }

  const wallets = await getWalletsByUser(session.userId);

  return (
    <div className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo />
          <h1 className="mt-6 text-2xl font-semibold">
            {wallets.length === 0
              ? "Crie sua primeira carteira"
              : "Selecione uma carteira"}
          </h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {wallets.length === 0
              ? "Lançamentos, cartões e categorias ficam vinculados à carteira que você escolher."
              : "Escolha qual carteira usar nesta sessão ou crie uma nova."}
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-6">
          {wallets.length === 0 ? (
            <WalletForm redirectOnSuccess="/" submitLabel="Criar e continuar" />
          ) : (
            <WalletSelectList wallets={wallets} />
          )}
        </div>
      </div>
    </div>
  );
}
