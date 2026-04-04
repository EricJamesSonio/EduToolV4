"use client";

import { SidebarShell } from "./SidebarShell";
import { useAuth } from "@/hooks/useAuth";
import { Users, LogOut } from "lucide-react";

const GROUPS = [
  {
    items: [
      {
        label: "Admins",
        href: "/platform/admins",
        icon: Users,
      },
    ],
  },
];

export function PlatformSidebar(): React.JSX.Element {
  const { user, logout } = useAuth();

  return (
    <SidebarShell
      header={
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">Platform Owner</p>
          <p className="font-medium truncate">{user?.fullName ?? "—"}</p>
        </div>
      }
      groups={GROUPS}
      footer={
        <button
          onClick={() => void logout()}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Log out</span>
        </button>
      }
    />
  );
}