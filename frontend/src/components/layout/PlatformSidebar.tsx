"use client";

import { SidebarShell } from "./SidebarShell";
import { LogoutButton } from "./LogoutButton";
import { useAuth } from "@/hooks/useAuth";
import { Users, ClipboardList } from "lucide-react";

const GROUPS = [
  {
    items: [
      {
        label: "Admins",
        href: "/platform/admins",
        icon: Users,
      },
      {
        label: "Requests",
        href: "/platform/requests",
        icon: ClipboardList,
      },
      {
        label: "Schools",
        href: "/platform/schools",
        icon: ClipboardList,
      },
    ],
  },
];

export function PlatformSidebar(): React.JSX.Element {
  const { user } = useAuth();

  return (
    <SidebarShell
      header={
        <div className="space-y-0.5">
          <p className="text-xs text-muted-foreground">Platform Owner</p>
          <p className="font-medium truncate">{user?.fullName ?? "—"}</p>
        </div>
      }
      groups={GROUPS}
      footer={<LogoutButton />}
    />
  );
}