"use client";

import { useRoleGuard } from "@/hooks/useRole";
import { TopBar } from "@/components/layout/TopBar";
import { StudentSidebar } from "@/components/layout/StudentSidebar";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useRoleGuard(["student"]);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <StudentSidebar />
      <main className="ml-56 pt-14 transition-all duration-200">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}