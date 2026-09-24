"use client";

import dynamic from "next/dynamic";
import { useRoleGuard } from "@/hooks/useRole";
import { RouteGuardLoader } from "@/components/shared/RouteGuardLoader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
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
  const { status, showLogoutPrompt, confirmLogout, cancelLogout } = useRoleGuard(["educator"]);
  if (status !== "allowed") return <RouteGuardLoader />;

  return (
    <>
      <ConfirmDialog
        open={showLogoutPrompt}
        onOpenChange={(open) => {
          if (!open) cancelLogout();
        }}
        title="Logout?"
        message="You are still signed in. Do you want to log out before leaving this portal?"
        confirmLabel="Logout"
        cancelLabel="Stay signed in"
        destructive
        onConfirm={confirmLogout}
      />
      <MeetingProvider>
        <SidebarProvider>
          <AppShell sidebar={<EducatorSidebar />}>
            {children}
            <WelcomeModal role="educator" />
          </AppShell>
        </SidebarProvider>
        <MeetingMiniPlayer />
      </MeetingProvider>
    </>
  );
}