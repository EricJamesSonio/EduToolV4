"use client";

import dynamic from "next/dynamic";
import { useRoleGuard } from "@/hooks/useRole";
import { RouteGuardLoader } from "@/components/shared/RouteGuardLoader";
import { WelcomeModal } from "@/components/shared/WelcomeModal";
import { EducatorSidebar } from "@/components/layout/EducatorSidebar";
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

export default function EducatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useRoleGuard(["educator"]);
  if (status !== "allowed") return <RouteGuardLoader />;

  return (
    <MeetingProvider>
      <SidebarProvider>
        <AppShell sidebar={<EducatorSidebar />}>
          {children}
          <WelcomeModal role="educator" />
        </AppShell>
      </SidebarProvider>
      <MeetingMiniPlayer />
    </MeetingProvider>
  );
}