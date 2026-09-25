"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  Home,
  Layers,
  Wallet,
} from "lucide-react";

import { cn } from "@/src/lib/utils";

const items = [
  { href: "/", label: "Início", icon: Home },
  { href: "/ganhos", label: "Ganhos", icon: ArrowUpCircle },
  { href: "/lancamentos", label: "Gastos", icon: ArrowDownCircle },
  { href: "/parcelamentos", label: "Parcelas", icon: Layers },
  { href: "/cartoes", label: "Cartões", icon: CreditCard },
  { href: "/wallets", label: "Carteiras", icon: Wallet },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/90 px-1.5 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-6 gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-medium transition-colors",
                  active
                    ? "bg-primary/15 text-primary-light"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon
                  className={cn("size-5", active && "text-primary-light")}
                  strokeWidth={active ? 2.25 : 1.75}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
