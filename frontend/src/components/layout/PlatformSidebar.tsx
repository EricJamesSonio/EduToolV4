"use client";

import { SidebarShell } from "./SidebarShell";
import { useAuth } from "@/hooks/useAuth";
import { Users } from "lucide-react";

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

export function PlatformSidebar() {
  const { user } = useAuth();

  return (
    <SidebarShell
      header={
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">Platform Owner</p>
          <p className="font-medium truncate">{user?.name ?? "—"}</p>
        </div>
      }
      groups={GROUPS}
    />
  );
}