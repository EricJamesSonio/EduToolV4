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
    <div className="min-h-screen bg-black text-white">
      <TopBar />

      {/* SIDEBAR WRAPPER = SINGLE SOURCE OF TRUTH */}
      <div
        className={cn(
          "fixed left-0 top-14 bottom-0 z-40 flex flex-col",
          "bg-black text-white border-r border-neutral-800",
          "transition-all duration-200",
          collapsed ? "w-14" : "w-56"
        )}
      >
        {sidebar}
      </div>

      <main
        className={cn(
          "pt-14 transition-all duration-200 bg-black text-white",
          collapsed ? "ml-14" : "ml-56"
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}