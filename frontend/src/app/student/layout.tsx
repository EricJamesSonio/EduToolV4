"use client";

import { useRoleGuard } from "@/hooks/useRole";
import { StudentSidebar } from "@/components/layout/StudentSidebar";
import { AppShell } from "@/components/layout/AppShell";
import { SidebarProvider } from "@/context/SidebarContext";
import { MeetingProvider } from "@/hooks/meeting/MeetingContext";
import { MeetingMiniPlayer } from "@/components/meeting/MeetingMiniPlayer";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useRoleGuard(["student"]);

  return (
    <MeetingProvider>
      <SidebarProvider>
        <AppShell sidebar={<StudentSidebar />}>
          {children}
        </AppShell>
      </SidebarProvider>
      <MeetingMiniPlayer />
    </MeetingProvider>
  );
}