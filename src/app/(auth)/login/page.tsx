import { LoginForm } from "@/src/app/(auth)/_components/login-form";
import { Logo } from "@/src/components/global/logo";

export default function LoginPage() {
  return (
    <div className="flex w-full flex-col">
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo />
        <p className="mt-3 max-w-sm text-sm text-muted-foreground">
          Controle financeiro do casal, simples e privado.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="mb-6 text-xl font-semibold">Entrar</h2>
        <LoginForm />
      </div>
    </div>
  );
}
