"use client";
import { useRoleGuard } from "@/hooks/useRole";
import { BackButtonGuard } from "@/components/shared/BackButtonGuard";
import { AdminWelcomeModal } from "@/components/shared/AdminWelcomeModal";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AppShell } from "@/components/layout/AppShell";
import { SidebarProvider } from "@/context/SidebarContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  useRoleGuard(["admin"]);
  return (
    <SidebarProvider>
      <AppShell sidebar={<AdminSidebar />}>
        {children}
        <BackButtonGuard />
        <AdminWelcomeModal />
      </AppShell>
    </SidebarProvider>
  );
}