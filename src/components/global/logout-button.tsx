import { LogOut } from "lucide-react";

import { logoutAction } from "@/src/actions/authentication/auth";
import { Button } from "@/src/components/ui/button";

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="h-10 w-full justify-start gap-2 rounded-xl px-3 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
      >
        <LogOut className="size-4" />
        Sair
      </Button>
    </form>
  );
}
