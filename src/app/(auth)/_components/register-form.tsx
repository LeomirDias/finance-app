"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerAction, type AuthActionState } from "@/src/actions/authentication/auth";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";

const initialState: AuthActionState = {};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-5">
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Seu nome"
          aria-invalid={!!state.fieldErrors?.name}
          className="h-11 rounded-xl text-base"
        />
        {state.fieldErrors?.name?.[0] && (
          <p className="text-sm text-destructive">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          placeholder="seu@email.com"
          aria-invalid={!!state.fieldErrors?.email}
          className="h-11 rounded-xl text-base"
        />
        {state.fieldErrors?.email?.[0] && (
          <p className="text-sm text-destructive">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          aria-invalid={!!state.fieldErrors?.password}
          className="h-11 rounded-xl text-base"
        />
        {state.fieldErrors?.password?.[0] && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.password[0]}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repita sua senha"
          aria-invalid={!!state.fieldErrors?.confirmPassword}
          className="h-11 rounded-xl text-base"
        />
        {state.fieldErrors?.confirmPassword?.[0] && (
          <p className="text-sm text-destructive">
            {state.fieldErrors.confirmPassword[0]}
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
        disabled={isPending}
        className="h-12 w-full rounded-xl text-base font-semibold"
      >
        {isPending ? "Criando conta..." : "Criar conta"}
      </Button>

      <div className="flex flex-col items-center gap-3 pt-2 text-sm">
        <Link
          href="/login"
          className="font-medium text-primary-light underline-offset-4 hover:underline active:opacity-70"
        >
          Já tenho conta
        </Link>
      </div>
    </form>
  );
}
