"use client";

import { useRoleGuard } from "@/hooks/useRole";
import { TopBar } from "@/components/layout/TopBar";
import { EducatorSidebar } from "@/components/layout/EducatorSidebar";

export default function EducatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useRoleGuard(["educator"]);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <EducatorSidebar />
      <main className="ml-56 pt-14 transition-all duration-200">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}