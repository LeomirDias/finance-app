"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CreditCard,
  Home,
  Layers,
  LogOut,
  Send,
  Wallet,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "../ui/sidebar";
import { logoutAction } from "@/src/actions/authentication/auth";
import { Logo } from "@/src/components/global/logo";
import { cn } from "@/src/lib/utils";

const navItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/lancamentos", label: "Lançamentos", icon: Send },
  { href: "/parcelamentos", label: "Parcelamentos", icon: Layers },
  { href: "/cartoes", label: "Cartões", icon: CreditCard },
  { href: "/wallets", label: "Carteiras", icon: Wallet },
];

function SidebarLogo() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Logo
      showText={!collapsed}
      className={cn(collapsed && "flex items-center justify-center")}
    />
  );
}

export function SidebarNav() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="mt-4 flex items-center justify-center border-b border-border/60 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2">
        <SidebarLogo />
      </SidebarHeader>

      <SidebarContent className="flex items-center justify-center">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={active}
                      tooltip={item.label}
                      className={cn(
                        "min-h-11",
                        active
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary hover:text-primary-foreground data-active:bg-primary data-active:text-primary-foreground"
                          : "bg-background text-foreground hover:bg-primary/5 hover:text-primary-light/75 data-active:bg-primary data-active:text-primary-foreground",
                      )}
                    >
                      <Icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border px-0 group-data-[collapsible=icon]:items-center">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-center">
            <form action={logoutAction}>
              <SidebarMenuButton
                type="submit"
                tooltip="Sair"
                className="min-h-11 hover:cursor-pointer hover:bg-transparent hover:text-destructive"
              >
                <LogOut />
                <span>Sair</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
