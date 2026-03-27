"use client";

import { useRoleGuard } from "@/hooks/useRole";
import { TopBar } from "@/components/layout/TopBar";
import { PlatformSidebar } from "@/components/layout/PlatformSidebar";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useRoleGuard(["platform_owner"]);

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <PlatformSidebar />
      <main className="ml-56 pt-14 transition-all duration-200">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}