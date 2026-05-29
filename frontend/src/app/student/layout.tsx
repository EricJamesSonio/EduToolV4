"use client";

import dynamic from "next/dynamic";
import { useRoleGuard } from "@/hooks/useRole";
import { StudentSidebar } from "@/components/layout/StudentSidebar";
import { AppShell } from "@/components/layout/AppShell";
import { SidebarProvider } from "@/context/SidebarContext";

const MeetingProvider = dynamic(
  () => import("@/hooks/meeting/MeetingContext").then((m) => m.MeetingProvider),
  { ssr: false }
);
const MeetingMiniPlayer = dynamic(
  () => import("@/components/meeting/MeetingMiniPlayer").then((m) => m.MeetingMiniPlayer),
  { ssr: false }
);

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