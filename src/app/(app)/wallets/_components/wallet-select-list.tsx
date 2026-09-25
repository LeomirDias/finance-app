"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { Wallet } from "lucide-react";
import Link from "next/link";

import { switchWalletAction } from "@/src/actions/wallets/switch-wallet";
import type { WalletRecord } from "@/src/actions/wallets/wallet-schema";
import { cn } from "@/src/lib/utils";

const statusLabels: Record<WalletRecord["status"], string> = {
  active: "Ativa",
  inactive: "Inativa",
  blocked: "Bloqueada",
};

const statusStyles: Record<WalletRecord["status"], string> = {
  active: "bg-emerald-500/15 text-emerald-400",
  inactive: "bg-muted text-muted-foreground",
  blocked: "bg-destructive/15 text-destructive",
};

type WalletSelectListProps = {
  wallets: WalletRecord[];
};

export function WalletSelectList({ wallets }: WalletSelectListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleSelect(walletId: string) {
    if (isPending || walletId === selectedId) {
      return;
    }

    setError(null);
    setSelectedId(walletId);

    const formData = new FormData();
    formData.set("walletId", walletId);

    startTransition(async () => {
      const result = await switchWalletAction({}, formData);

      if (result.success) {
        router.push("/");
        router.refresh();
        return;
      }

      setSelectedId(null);
      setError(result.error ?? "Não foi possível selecionar a carteira.");
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted-foreground">
        Escolha qual carteira deseja usar nesta sessão.
      </p>

      <div className="grid gap-3">
        {wallets.map((wallet) => {
          const isSelecting = isPending && selectedId === wallet.id;

          return (
            <button
              key={wallet.id}
              type="button"
              disabled={isPending}
              onClick={() => handleSelect(wallet.id)}
              className={cn(
                "flex w-full items-center gap-4 rounded-xl border border-border/60 bg-card p-4 text-left transition-colors hover:border-primary/30 hover:bg-muted/20 disabled:opacity-60",
                isSelecting && "ring-2 ring-primary/40",
              )}
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary-light">
                <Wallet className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{wallet.name}</p>
                <span
                  className={cn(
                    "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                    statusStyles[wallet.status],
                  )}
                >
                  {statusLabels[wallet.status]}
                </span>
              </div>
              {isSelecting && (
                <span className="text-sm text-muted-foreground">...</span>
              )}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Link
        href="/wallets/new"
        className="flex h-10 items-center justify-center rounded-xl border border-dashed border-border/60 px-4 py-3 text-sm font-medium text-primary-light transition-colors hover:border-primary/40 hover:bg-primary/5"
      >
        Criar nova carteira
      </Link>
    </div>
  );
}
