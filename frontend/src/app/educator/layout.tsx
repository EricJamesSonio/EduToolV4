"use client";

import dynamic from "next/dynamic";
import { useRoleGuard } from "@/hooks/useRole";
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