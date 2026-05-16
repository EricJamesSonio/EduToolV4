// ===== File: frontend\src\app\educator\layout.tsx =====
"use client";

import { useRoleGuard } from "@/hooks/useRole";
import { EducatorSidebar } from "@/components/layout/EducatorSidebar";
import { AppShell } from "@/components/layout/AppShell";
import { SidebarProvider } from "@/context/SidebarContext";

export default function EducatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useRoleGuard(["educator"]);

  return (
    <SidebarProvider>
      <AppShell sidebar={<EducatorSidebar />}>
        {children}
      </AppShell>
    </SidebarProvider>
  );
}