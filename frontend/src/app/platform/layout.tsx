"use client";

import { useRoleGuard } from "@/hooks/useRole";
import { RouteGuardLoader } from "@/components/shared/RouteGuardLoader";
import { PlatformSidebar } from "@/components/layout/PlatformSidebar";
import { AppShell } from "@/components/layout/AppShell";
import { SidebarProvider } from "@/context/SidebarContext";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useRoleGuard(["platform_owner"]);
  if (status !== "allowed") return <RouteGuardLoader />;

  return (
    <SidebarProvider>
      <AppShell sidebar={<PlatformSidebar />}>
        {children}
      </AppShell>
    </SidebarProvider>
  );
}
