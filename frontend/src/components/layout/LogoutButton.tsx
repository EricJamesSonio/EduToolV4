"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/context/SidebarContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function LogoutButton(): React.JSX.Element {
  const router = useRouter();
  const { collapsed } = useSidebar();

  function handleLogout(): void {
    localStorage.clear();
    router.push("/login");
  }

  const button = (
    <button
      onClick={handleLogout}
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

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={button} />
        <TooltipContent side="right">Log out</TooltipContent>
      </Tooltip>
    );
  }

  return button;
}