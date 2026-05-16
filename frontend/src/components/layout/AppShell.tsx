"use client";

import { TopBar } from "./TopBar";
import { useSidebar } from "@/context/SidebarContext";
import { cn } from "@/lib/utils";
import { PageContainer } from "./PageContainer";

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
          "pt-14 transition-all duration-200",
          collapsed ? "ml-14" : "ml-56"
        )}
      >
        <div className="p-6">
          <PageContainer>{children}</PageContainer>
        </div>
      </main>
    </div>
  );
}