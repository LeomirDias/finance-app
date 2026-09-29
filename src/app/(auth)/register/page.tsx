import type { Metadata } from "next";

import { RegisterForm } from "@/src/app/(auth)/_components/register-form";

export const metadata: Metadata = {
  title: "Criar conta",
};
import { Logo } from "@/src/components/global/logo";

export default function RegisterPage() {
  return (
    <div className="flex w-full flex-col">
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo />
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Criar conta</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Comece a organizar as finanças do casal.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <RegisterForm />
      </div>
    </div>
  );
}
