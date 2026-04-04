"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface LogoutButtonProps {
  collapsed?: boolean;
}

export function LogoutButton({ collapsed = false }: LogoutButtonProps): React.JSX.Element {
  const router = useRouter();

  function handleLogout(): void {
    localStorage.clear(); // clears all localStorage entries
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

  return button;
}