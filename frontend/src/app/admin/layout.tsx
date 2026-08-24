"use client";
import { useRoleGuard } from "@/hooks/useRole";
import { RouteGuardLoader } from "@/components/shared/RouteGuardLoader";
import { AdminWelcomeModal } from "@/components/shared/AdminWelcomeModal";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AppShell } from "@/components/layout/AppShell";
import { SidebarProvider } from "@/context/SidebarContext";
import { OrganizationGuardProvider } from "@/context/OrganizationGuardContext";
import { NavigationGuardProvider } from "@/context/NavigationGuardContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { status } = useRoleGuard(["admin"]);
  if (status !== "allowed") return <RouteGuardLoader />;
  return (
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
  );
}