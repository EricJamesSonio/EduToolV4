"use client";

import { useRoleGuard } from "@/hooks/useRole";
import { BackButtonGuard } from "@/components/shared/BackButtonGuard";
import { PlatformSidebar } from "@/components/layout/PlatformSidebar";
import { AppShell } from "@/components/layout/AppShell";
import { SidebarProvider } from "@/context/SidebarContext";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const canRender = useRoleGuard(["platform_owner"]);
  if (!canRender) return null;

  return (
    <SidebarProvider>
      <AppShell sidebar={<PlatformSidebar />}>
        {children}
        <BackButtonGuard />
      </AppShell>
    </SidebarProvider>
  );
}
