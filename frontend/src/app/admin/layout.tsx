"use client";
import { useRoleGuard } from "@/hooks/useRole";
import { RouteGuardLoader } from "@/components/shared/RouteGuardLoader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AdminWelcomeModal } from "@/components/shared/AdminWelcomeModal";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AppShell } from "@/components/layout/AppShell";
import { SidebarProvider } from "@/context/SidebarContext";
import { OrganizationGuardProvider } from "@/context/OrganizationGuardContext";
import { NavigationGuardProvider } from "@/context/NavigationGuardContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { status, showLogoutPrompt, confirmLogout, cancelLogout } = useRoleGuard(["admin"]);
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
        <OrganizationGuardProvider>
          <NavigationGuardProvider>
            <AppShell sidebar={<AdminSidebar />}>
              {children}
              <AdminWelcomeModal />
            </AppShell>
          </NavigationGuardProvider>
        </OrganizationGuardProvider>
      </SidebarProvider>
    </>
  );
}