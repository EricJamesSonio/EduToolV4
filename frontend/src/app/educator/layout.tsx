"use client";

import { useRoleGuard } from "@/hooks/useRole";
import { EducatorSidebar } from "@/components/layout/EducatorSidebar";
import { AppShell } from "@/components/layout/AppShell";
import { SidebarProvider } from "@/context/SidebarContext";
import { MeetingProvider } from "@/hooks/meeting/MeetingContext";
import { MeetingMiniPlayer } from "@/components/meeting/MeetingMiniPlayer";

export default function EducatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useRoleGuard(["educator"]);

  return (
    <MeetingProvider>
      <SidebarProvider>
        <AppShell sidebar={<EducatorSidebar />}>
          {children}
        </AppShell>
      </SidebarProvider>
      <MeetingMiniPlayer />
    </MeetingProvider>
  );
}