import { cookies } from "next/headers";

import {
  SidebarInset,
  SidebarProvider,
} from "@/src/components/ui/sidebar";
import { TooltipProvider } from "@/src/components/ui/tooltip";
import { SidebarNav } from "@/src/components/global/sidebar-nav";
import { AppHeader } from "@/src/components/global/app-header";
import { MobileBottomNav } from "@/src/components/global/mobile-bottom-nav";
import { MobileCreateMenu } from "@/src/components/global/mobile-create-menu";
import { requireSession } from "@/src/lib/require-session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get("sidebar_state");
  const defaultOpen = sidebarCookie ? sidebarCookie.value === "true" : false;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <TooltipProvider>
        <SidebarNav />
        <SidebarInset className="app-shell min-h-dvh bg-background font-sans">
          <div className="border-b border-border">
            <AppHeader userName={session.user.name} />
          </div>
          <div className="flex-1">{children}</div>
          <MobileCreateMenu />
          <MobileBottomNav />
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  );
}
