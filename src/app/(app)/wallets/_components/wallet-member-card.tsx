"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";

import { deleteWalletMemberAction } from "@/src/actions/wallets/delete-wallet-member";
import type { WalletMemberRecord } from "@/src/actions/wallets/get-wallet-members";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Button } from "@/src/components/ui/button";
import { getInitials } from "@/src/lib/helpers/format";

type WalletMemberCardProps = {
  member: WalletMemberRecord;
  isCurrentUser: boolean;
  canRemove: boolean;
};

export function WalletMemberCard({
  member,
  isCurrentUser,
  canRemove,
}: WalletMemberCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleRemove() {
    const label = member.name ?? member.email;

    if (
      !window.confirm(
        isCurrentUser
          ? "Remover-se desta carteira? Você perderá acesso aos dados dela."
          : `Remover ${label} desta carteira?`,
      )
    ) {
      return;
    }

    setError(null);
    const formData = new FormData();
    formData.set("id", member.id);

    startTransition(async () => {
      const result = await deleteWalletMemberAction({}, formData);

      if (result.success) {
        if (isCurrentUser) {
          router.push("/wallets/select");
        }
        router.refresh();
        return;
      }

      setError(result.error ?? "Não foi possível remover o membro.");
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex min-h-11 items-center gap-4 rounded-2xl border border-border/60 bg-card p-4">
        <Avatar className="size-11 ring-2 ring-primary/20">
          <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
            {getInitials(member.name ?? member.email)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {member.name ?? "Usuário"}
            {isCurrentUser && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (você)
              </span>
            )}
          </p>
          <p className="truncate text-sm text-muted-foreground">{member.email}</p>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            disabled={isPending}
            onClick={handleRemove}
            className="shrink-0 text-destructive hover:text-destructive"
          >
            Remover
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
