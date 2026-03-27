"use client";

import { useRoleGuard } from "@/hooks/useRole";
import { TopBar } from "@/components/layout/TopBar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useRoleGuard(["admin"]);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <AdminSidebar />
      <main className="ml-56 pt-14 transition-all duration-200">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}