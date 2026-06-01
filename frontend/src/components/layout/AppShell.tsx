"use client";

import { PortalNavbar } from "./PortalNavbar";
import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";

interface AppShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ sidebar, children }: AppShellProps) {
  const { collapsed, isMobile } = useSidebar();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PortalNavbar />

      {sidebar}

      <main
        className={cn(
          "pt-[76px] transition-all duration-200 bg-background text-foreground",
          isMobile ? "ml-0" : collapsed ? "ml-14" : "ml-56"
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
