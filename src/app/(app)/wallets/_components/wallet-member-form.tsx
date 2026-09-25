"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { upsertWalletMemberAction } from "@/src/actions/wallets/upsert-wallet-member";
import type { WalletActionState } from "@/src/actions/wallets/wallet-schema";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

const initialState: WalletActionState = {};

type WalletMemberFormProps = {
  walletId: string;
};

export function WalletMemberForm({ walletId }: WalletMemberFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    upsertWalletMemberAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <input type="hidden" name="walletId" value={walletId} />

      <div className="space-y-2">
        <Label htmlFor="email">E-mail do membro</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="membro@email.com"
          aria-invalid={!!state.fieldErrors?.email}
          className="h-11 rounded-xl text-base"
        />
        {state.fieldErrors?.email?.[0] && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.email[0]}
          </p>
        )}
        {state.fieldErrors?.userId?.[0] && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.userId[0]}
          </p>
        )}
      </div>

      {state.error && (
        <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          Membro adicionado com sucesso.
        </div>
      )}

      <Button
        type="submit"
        variant="default"
        disabled={isPending}
        className="h-12 w-full rounded-xl text-base font-semibold"
      >
        {isPending ? "Adicionando..." : "Adicionar membro"}
      </Button>
    </form>
  );
}
