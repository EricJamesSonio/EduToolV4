"use client";

import { useState } from "react";

import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { organizationApi } from "@/api/admin/organization.api";
import { OrganizationSetupForm } from "@/components/shared/OrganizationSetupForm";
import {
  WelcomeActions,
  WelcomeDialogShell,
  WelcomeFeatureList,
  WelcomeHeader,
} from "@/components/shared/WelcomeDialogShell";

const ADMIN_FEATURES = [
  "Set up and manage your school organization",
  "Create departments, levels, and sections",
  "Enroll students and assign educators",
  "Configure grading scales and assessments",
] as const;

export function AdminWelcomeModal() {
  const [open, setOpen] = useState(true);
  const [view, setView] = useState<"welcome" | "setup">("welcome");

  const { data: org, isLoading } = useAsyncQuery(
    queryKeys.admin.organization.detail(),
    organizationApi.getOrg,
    { retry: false },
  );

  if (isLoading || org !== null) return null;

  return (
    <WelcomeDialogShell
      open={open}
      onOpenChange={(next) => {
        if (!next) setOpen(false);
      }}
    >
      {view === "welcome" ? (
        <WelcomeView
          onSetup={() => setView("setup")}
          onDismiss={() => setOpen(false)}
        />
      ) : (
        <SetupView
          onSuccess={() => setOpen(false)}
          onBack={() => setView("welcome")}
        />
      )}
    </WelcomeDialogShell>
  );
}

function WelcomeView({
  onSetup,
  onDismiss,
}: {
  onSetup: () => void;
  onDismiss: () => void;
}) {
  return (
    <>
      <WelcomeHeader icon={Building2} title="Welcome, Admin!" />

      <WelcomeFeatureList features={ADMIN_FEATURES} />

      <p className="text-sm text-muted-foreground">
        Each page has a help guide, look for the <span className="italic">Help</span> icon.
      </p>

      <WelcomeActions>
        <Button onClick={onSetup} className="w-full sm:w-auto">
          Create Organization
        </Button>
        <Button variant="ghost" onClick={onDismiss} className="w-full sm:w-auto">
          Not now
        </Button>
      </WelcomeActions>
    </>
  );
}

function SetupView({
  onSuccess,
  onBack,
}: {
  onSuccess: () => void;
  onBack: () => void;
}) {
  const [isPending, setIsPending] = useState(false);

  return (
    <>
      <WelcomeHeader icon={Building2} title="Set up your organization" />

      <p className="text-sm text-muted-foreground">
        Before you get started, give your school a name. You can update this later.
      </p>

      <OrganizationSetupForm onSuccess={onSuccess} onPendingChange={setIsPending} />

      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        disabled={isPending}
        className="w-full"
      >
        Back
      </Button>
    </>
  );
}