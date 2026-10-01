"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowDownCircle,
  Layers,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";

import { cn } from "@/src/lib/utils";

const options = [
  {
    href: "/gastos?novo=1",
    label: "Gasto",
    description: "Avulso ou com data prevista",
    icon: ArrowDownCircle,
  },
  {
    href: "/parcelamentos?novo=1",
    label: "Parcelamento",
    description: "Compra dividida em parcelas",
    icon: Layers,
  },
  {
    href: "/assinaturas?novo=1",
    label: "Assinatura",
    description: "Serviço com cobrança mensal",
    icon: Sparkles,
  },
  {
    href: "/recorrentes?novo=1",
    label: "Recorrente",
    description: "Pagamento fixo todo mês",
    icon: RefreshCw,
  },
] as const;

export function MobileCreateMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="md:hidden">
      {open && (
        <button
          type="button"
          aria-label="Fechar seletor"
          className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed right-4 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-40 flex flex-col items-end gap-3">
        {open && (
          <div
            role="menu"
            aria-label="Tipo de formulário"
            className="w-[min(18.5rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border/70 bg-popover p-1.5 shadow-xl"
          >
            <p className="px-3 pt-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Novo lançamento
            </p>
            {options.map((option) => {
              const Icon = option.icon;

              return (
                <Link
                  key={option.href}
                  href={option.href}
                  role="menuitem"
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-primary/10"
                  onClick={() => setOpen(false)}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary-light">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0 text-left">
                    <span className="block text-sm font-semibold">
                      {option.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={
            open
              ? "Fechar seletor de formulário"
              : "Abrir seletor de formulário"
          }
          onClick={() => setOpen((current) => !current)}
          className="inline-flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-opacity hover:opacity-90"
        >
          <Plus
            className={cn("size-6 transition-transform", open && "rotate-45")}
          />
        </button>
      </div>
    </div>
  );
}
