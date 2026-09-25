"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import Link from "next/link";

import { switchWalletAction } from "@/src/actions/wallets/switch-wallet";
import type { WalletRecord } from "@/src/actions/wallets/wallet-schema";

type WalletSelectorProps = {
  wallets: WalletRecord[];
  activeWalletId?: string;
};

export function WalletSelector({
  wallets,
  activeWalletId,
}: WalletSelectorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (wallets.length === 0) {
    return (
      <div className="border-b border-border/60 bg-background/90 px-6 py-3 backdrop-blur-xl">
        <div className="content-container flex py-0! items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Carteira</span>
          <Link
            href="/wallets/select"
            className="text-sm font-medium text-primary-light transition-opacity hover:opacity-80"
          >
            Configurar
          </Link>
        </div>
      </div>
    );
  }

  if (!activeWalletId) {
    return (
      <div className="border-b border-border/60 bg-background/90 px-6 py-3 backdrop-blur-xl">
        <div className="content-container flex py-0 items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">Carteira</span>
          <Link
            href="/wallets/select"
            className="text-sm font-medium text-primary-light transition-opacity hover:opacity-80"
          >
            Selecionar
          </Link>
        </div>
        {error && (
          <p className="content-container py-0 mt-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  }

  async function handleChange(walletId: string) {
    if (!walletId || walletId === activeWalletId) {
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.set("walletId", walletId);

    startTransition(async () => {
      const result = await switchWalletAction({}, formData);

      if (result.success) {
        router.refresh();
        return;
      }

      setError(result.error ?? "Não foi possível trocar de carteira.");
    });
  }

  return (
    <div className="border-b border-border/60 bg-background/90 px-6 py-3 backdrop-blur-xl">
      <div className="content-container flex py-0 items-center gap-4">
        <label
          htmlFor="wallet-selector"
          className="shrink-0 text-sm text-muted-foreground"
        >
          Carteira ativa
        </label>
        <select
          id="wallet-selector"
          value={activeWalletId ?? ""}
          disabled={isPending || wallets.length <= 1}
          onChange={(event) => handleChange(event.target.value)}
          className="h-9 max-w-xs rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
        >
          {wallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name}
            </option>
          ))}
        </select>
        <Link
          href="/wallets"
          className="shrink-0 text-sm font-medium text-primary-light transition-opacity hover:opacity-80"
        >
          Gerenciar carteiras
        </Link>
      </div>
      {error && (
        <p className="content-container py-0 mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
