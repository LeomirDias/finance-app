"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { Plus } from "lucide-react";

import { deleteWalletAction } from "@/src/actions/wallets/delete-wallet";
import { switchWalletAction } from "@/src/actions/wallets/switch-wallet";
import type { WalletRecord } from "@/src/actions/wallets/wallet-schema";
import { Button, buttonVariants } from "@/src/components/ui/button";
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

type WalletListProps = {
  wallets: WalletRecord[];
  activeWalletId?: string | null;
};

export function WalletList({ wallets, activeWalletId }: WalletListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorById, setErrorById] = useState<Record<string, string>>({});

  function handleSwitch(wallet: WalletRecord) {
    if (wallet.id === activeWalletId || isPending) return;

    setErrorById((prev) => {
      const next = { ...prev };
      delete next[wallet.id];
      return next;
    });

    const formData = new FormData();
    formData.set("walletId", wallet.id);

    startTransition(async () => {
      const result = await switchWalletAction({}, formData);
      if (result.success) {
        router.refresh();
        return;
      }
      setErrorById((prev) => ({
        ...prev,
        [wallet.id]: result.error ?? "Não foi possível trocar de carteira.",
      }));
    });
  }

  function handleDelete(wallet: WalletRecord) {
    if (
      !window.confirm(
        `Excluir a carteira "${wallet.name}"? Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }

    setErrorById((prev) => {
      const next = { ...prev };
      delete next[wallet.id];
      return next;
    });

    const formData = new FormData();
    formData.set("id", wallet.id);

    startTransition(async () => {
      const result = await deleteWalletAction({}, formData);
      if (result.success) {
        router.refresh();
        return;
      }
      setErrorById((prev) => ({
        ...prev,
        [wallet.id]: result.error ?? "Não foi possível excluir a carteira.",
      }));
    });
  }

  if (wallets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Você ainda não possui carteiras. Crie a primeira para começar.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {wallets.map((wallet) => {
        const isActive = wallet.id === activeWalletId;
        const error = errorById[wallet.id];

        return (
          <li
            key={wallet.id}
            className={cn(
              "flex flex-col justify-between gap-4 rounded-2xl border border-border/60 p-5",
              isActive && "ring-2 ring-primary/30",
            )}
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{wallet.name}</p>
                {isActive && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary-light">
                    Em uso
                  </span>
                )}
              </div>
              <span
                className={cn(
                  "mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                  statusStyles[wallet.status],
                )}
              >
                {statusLabels[wallet.status]}
              </span>
              {error && (
                <p className="mt-2 text-sm text-destructive">{error}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {!isActive && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  className="h-10 flex-1 rounded-xl"
                  onClick={() => handleSwitch(wallet)}
                >
                  Usar
                </Button>
              )}
              <Link
                href={`/wallets/${wallet.id}/edit`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 flex-1 rounded-xl",
                )}
              >
                Editar
              </Link>
              <Link
                href={`/wallets/${wallet.id}/members`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 flex-1 rounded-xl",
                )}
              >
                Membros
              </Link>
              <Button
                type="button"
                variant="destructive"
                disabled={isPending}
                className="h-10 rounded-xl"
                onClick={() => handleDelete(wallet)}
              >
                Excluir
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function NewWalletButton() {
  return (
    <Link
      href="/wallets/new"
      className={cn(
        buttonVariants({ variant: "default" }),
        "h-11 gap-2 rounded-xl font-semibold sm:h-12",
      )}
    >
      <Plus className="size-4" />
      Nova carteira
    </Link>
  );
}
