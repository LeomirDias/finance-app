import { cookies } from "next/headers";

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/src/components/ui/sidebar";
import { TooltipProvider } from "@/src/components/ui/tooltip";
import { SidebarNav } from "@/src/components/global/sidebar-nav";
import { AppHeader } from "@/src/components/global/app-header";
import { MobileBottomNav } from "@/src/components/global/mobile-bottom-nav";
import { auth } from "@/src/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const cookieStore = await cookies();
  const sidebarCookie = cookieStore.get("sidebar_state");
  const defaultOpen = sidebarCookie ? sidebarCookie.value === "true" : false;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <TooltipProvider>
        <SidebarNav />
        <SidebarInset className="app-shell min-h-dvh bg-background font-sans">
          <div className="flex items-start gap-2 border-b border-border">
            <div className="flex items-center p-2 md:hidden">
              <SidebarTrigger className="size-11 rounded-xl" />
            </div>
            <div className="min-w-0 flex-1">
              <AppHeader userName={session?.user?.name} />
            </div>
          </div>
          <div className="flex-1">{children}</div>
          <MobileBottomNav />
        </SidebarInset>
      </TooltipProvider>
    </SidebarProvider>
  );
}
