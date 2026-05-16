// ===== File: frontend\src\app\student\layout.tsx =====
"use client";

import { useRoleGuard } from "@/hooks/useRole";
import { StudentSidebar } from "@/components/layout/StudentSidebar";
import { AppShell } from "@/components/layout/AppShell";
import { SidebarProvider } from "@/context/SidebarContext";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useRoleGuard(["student"]);

  return (
    <SidebarProvider>
      <AppShell sidebar={<StudentSidebar />}>
        {children}
      </AppShell>
    </SidebarProvider>
  );
}