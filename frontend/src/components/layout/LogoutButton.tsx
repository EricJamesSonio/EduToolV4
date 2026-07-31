"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/context/SidebarContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";

export function LogoutButton(): React.JSX.Element {
  const { collapsed } = useSidebar();
  const { logout } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout(): Promise<void> {
    setIsLoggingOut(true);
    // Canonical logout: clears API session, auth state, query cache and
    // redirects to /login (replacing history) — see AuthContext.logout().
    await logout();
  }

  const button = (
    <button
      onClick={() => setShowConfirm(true)}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
        collapsed && "justify-center px-2"
      )}
    >
      <LogOut className="h-4 w-4 shrink-0" />
      {!collapsed && <span>Log out</span>}
    </button>
  );

  return (
    <>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger render={button} />
          <TooltipContent side="right">Log out</TooltipContent>
        </Tooltip>
      ) : (
        button
      )}

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Logout?"
        message="Are you sure you want to log out?"
        confirmLabel="Logout"
        destructive
        isLoading={isLoggingOut}
        onConfirm={handleLogout}
      />
    </>
  );
}
