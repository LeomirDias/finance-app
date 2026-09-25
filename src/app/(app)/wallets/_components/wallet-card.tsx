"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { MoreHorizontal, Trash, Wallet } from "lucide-react";

import { deleteWalletAction } from "@/src/actions/wallets/delete-wallet";
import { switchWalletAction } from "@/src/actions/wallets/switch-wallet";
import type { WalletRecord } from "@/src/actions/wallets/wallet-schema";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
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

type WalletCardProps = {
  wallet: WalletRecord;
  isActive: boolean;
};

export function WalletCard({ wallet, isActive }: WalletCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showActions, setShowActions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleSwitch() {
    if (isActive || isPending) {
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.set("walletId", wallet.id);

    startTransition(async () => {
      const result = await switchWalletAction({}, formData);

      if (result.success) {
        router.refresh();
        return;
      }

      setError(result.error ?? "Não foi possível trocar de carteira.");
    });
  }

  function handleDelete() {
    if (
      !window.confirm(
        `Excluir a carteira "${wallet.name}"? Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.set("id", wallet.id);

    startTransition(async () => {
      const result = await deleteWalletAction({}, formData);

      if (result.success) {
        router.refresh();
        return;
      }

      setError(result.error ?? "Não foi possível excluir a carteira.");
    });
  }

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/60",
        isActive && "ring-2 ring-primary/30",
      )}
    >
      <CardContent className="p-0">
        <button
          type="button"
          onClick={handleSwitch}
          disabled={isPending || isActive}
          className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-muted/40 disabled:cursor-default"
        >
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary-light">
            <Wallet className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold">{wallet.name}</p>
              {isActive && (
                <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary-light">
                  Em uso
                </span>
              )}
            </div>
            <span
              className={cn(
                "mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                statusStyles[wallet.status],
              )}
            >
              {statusLabels[wallet.status]}
            </span>
          </div>
        </button>

        <div className="flex items-center border-t border-border/60">
          <Link
            href={`/wallets/${wallet.id}/edit`}
            className="flex flex-1 items-center justify-center py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            Editar
          </Link>
          <div className="h-6 w-px bg-border/60" />
          <Link
            href={`/wallets/${wallet.id}/members`}
            className="flex flex-1 items-center justify-center py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
          >
            Membros
          </Link>
          <div className="h-6 w-px bg-border/60" />
          <div className="p-3">
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={handleDelete}
              className="w-full rounded-xl p-4"
            >
              <Trash className="size-4" />
            </Button>
          </div>
        </div>

        {error && (
          <p className="border-t border-border/60 px-5 py-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
