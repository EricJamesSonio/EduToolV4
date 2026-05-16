"use client";

import { TopBar } from "./TopBar";
import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";

interface AppShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ sidebar, children }: AppShellProps) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />

      {sidebar}

      <main
        className={cn(
          "pt-14 transition-all duration-200 bg-background text-foreground",
          collapsed ? "ml-14" : "ml-56"
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}