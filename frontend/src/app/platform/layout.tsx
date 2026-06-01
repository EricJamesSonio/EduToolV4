"use client";

import { useRoleGuard } from "@/hooks/useRole";
import { PlatformSidebar } from "@/components/layout/PlatformSidebar";
import { AppShell } from "@/components/layout/AppShell";
import { SidebarProvider } from "@/context/SidebarContext";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useRoleGuard(["platform_owner"]);

  return (
    <SidebarProvider>
      <AppShell sidebar={<PlatformSidebar />}>
        {children}
      </AppShell>
    </SidebarProvider>
  );
}
