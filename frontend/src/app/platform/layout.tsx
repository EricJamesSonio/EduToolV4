"use client";

import { useRoleGuard } from "@/hooks/useRole";
import { RouteGuardLoader } from "@/components/shared/RouteGuardLoader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PlatformSidebar } from "@/components/layout/PlatformSidebar";
import { AppShell } from "@/components/layout/AppShell";
import { SidebarProvider } from "@/context/SidebarContext";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status, showLogoutPrompt, confirmLogout, cancelLogout } = useRoleGuard(["platform_owner"]);
  if (status !== "allowed") return <RouteGuardLoader />;

  return (
    <>
      <ConfirmDialog
        open={showLogoutPrompt}
        onOpenChange={(open) => {
          if (!open) cancelLogout();
        }}
        title="Logout?"
        message="You are still signed in. Do you want to log out before leaving this portal?"
        confirmLabel="Logout"
        cancelLabel="Stay signed in"
        destructive
        onConfirm={confirmLogout}
      />
      <SidebarProvider>
        <AppShell sidebar={<PlatformSidebar />}>
          {children}
        </AppShell>
      </SidebarProvider>
    </>
  );
}
