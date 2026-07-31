"use client";

import dynamic from "next/dynamic";
import { useRoleGuard } from "@/hooks/useRole";
import { RouteGuardLoader } from "@/components/shared/RouteGuardLoader";
import { WelcomeModal } from "@/components/shared/WelcomeModal";
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
  const { status } = useRoleGuard(["student"]);
  if (status !== "allowed") return <RouteGuardLoader />;

  return (
    <MeetingProvider>
      <SidebarProvider>
        <AppShell sidebar={<StudentSidebar />}>
          {children}
          <WelcomeModal role="student" />
        </AppShell>
      </SidebarProvider>
      <MeetingMiniPlayer />
    </MeetingProvider>
  );
}