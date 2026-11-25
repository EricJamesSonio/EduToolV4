"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useRole, useRoleGuard } from "@/hooks/useRole";
import { RouteGuardLoader } from "@/components/shared/RouteGuardLoader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { AdminWelcomeModal } from "@/components/shared/AdminWelcomeModal";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AppShell } from "@/components/layout/AppShell";
import { SidebarProvider } from "@/context/SidebarContext";
import { OrganizationGuardProvider } from "@/context/OrganizationGuardContext";
import { NavigationGuardProvider } from "@/context/NavigationGuardContext";
import { SchoolProfileSetupModal } from "@/components/admin/school-profile/SchoolProfileSetupModal"
import {
  REGISTRAR_HOME_PATH,
  isRegistrarPathAllowed,
  toAdminPath,
  toRegistrarPath,
} from "@/utils/registrar-access.util";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { status, showLogoutPrompt, confirmLogout, cancelLogout } = useRoleGuard(["admin"]);
  const { isRegistrar } = useRole();
  const pathname = usePathname();
  const router = useRouter();

  const registrarBlocked = isRegistrar && !isRegistrarPathAllowed(pathname);

  useEffect(() => {
    if (status === "allowed" && registrarBlocked) {
      router.replace(REGISTRAR_HOME_PATH);
    }
  }, [status, registrarBlocked, router]);

  // Keep each role on its own URL prefix: registrars live under /registrar,
  // admins under /admin. Uses the real browser path so it can never loop.
  useEffect(() => {
    if (status !== "allowed" || registrarBlocked) return;
    const { pathname: browserPath, search, hash } = window.location;
    const target = isRegistrar
      ? toRegistrarPath(browserPath)
      : toAdminPath(browserPath);
    if (target !== browserPath) {
      router.replace(`${target}${search}${hash}`);
    }
  }, [status, registrarBlocked, isRegistrar, pathname, router]);

  if (status !== "allowed" || registrarBlocked) return <RouteGuardLoader />;
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
              {!isRegistrar && <AdminWelcomeModal />}
              {!isRegistrar && <SchoolProfileSetupModal />}
            </AppShell>
          </NavigationGuardProvider>
        </OrganizationGuardProvider>
      </SidebarProvider>
    </>
  );
}