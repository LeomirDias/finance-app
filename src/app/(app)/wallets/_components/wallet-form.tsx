"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";

import { upsertWalletAction } from "@/src/actions/wallets/upsert-wallet";
import type { WalletActionState } from "@/src/actions/wallets/wallet-schema";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

const initialState: WalletActionState = {};

const statusOptions = [
  { value: "active", label: "Ativa" },
  { value: "inactive", label: "Inativa" },
  { value: "blocked", label: "Bloqueada" },
] as const;

type WalletFormProps = {
  walletId?: string;
  defaultName?: string;
  defaultStatus?: "active" | "inactive" | "blocked";
  redirectOnSuccess?: string;
  submitLabel?: string;
};

export function WalletForm({
  walletId,
  defaultName = "",
  defaultStatus = "active",
  redirectOnSuccess = "/",
  submitLabel,
}: WalletFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    upsertWalletAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      router.push(redirectOnSuccess);
      router.refresh();
    }
  }, [state.success, redirectOnSuccess, router]);

  const isEditing = !!walletId;
  const label = submitLabel ?? (isEditing ? "Salvar alterações" : "Criar carteira");

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      {walletId && <input type="hidden" name="id" value={walletId} />}

      <div className="space-y-2">
        <Label htmlFor="name">Nome da carteira</Label>
        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={defaultName}
          placeholder="Ex.: Finanças do casal"
          autoComplete="off"
          aria-invalid={!!state.fieldErrors?.name}
          className="h-11 rounded-xl text-base"
        />
        {state.fieldErrors?.name?.[0] && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={defaultStatus}
          aria-invalid={!!state.fieldErrors?.status}
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-base font-medium outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {state.fieldErrors?.status?.[0] && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.status[0]}
          </p>
        )}
      </div>

      {state.error && (
        <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <Button
        type="submit"
        variant="default"
        disabled={isPending}
        className="h-12 w-full rounded-xl text-base font-semibold"
      >
        {isPending ? "Salvando..." : label}
      </Button>
    </form>
  );
}
