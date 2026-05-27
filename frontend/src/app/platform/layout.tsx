"use client";

import { useRoleGuard } from "@/hooks/useRole";
import { PortalNavbar } from "@/components/layout/PortalNavbar";
import { PlatformSidebar } from "@/components/layout/PlatformSidebar";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useRoleGuard(["platform_owner"]);

  return (
    <div className="min-h-screen bg-background">
      <PortalNavbar />
      <PlatformSidebar />
      <main className="ml-56 pt-[76px] transition-all duration-200">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}