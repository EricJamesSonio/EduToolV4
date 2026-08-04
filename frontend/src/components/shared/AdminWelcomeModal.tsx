"use client";

import { useState } from "react";

import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { organizationApi } from "@/api/admin/organization.api";
import { OrganizationSetupForm } from "@/components/shared/OrganizationSetupForm";

/**
 * Admin Welcome Modal
 *
 * Shows when the admin has no organization yet.
 * Two-step flow inside one dialog:
 *   1. Welcome view — feature overview + "Create Org" / "Not now"
 *   2. Setup view   — org creation form (name, description)
 *
 * Placed in the admin layout. No localStorage — shows on mount if
 * `org === null`, hides on dismiss until page refresh.
 */

export function AdminWelcomeModal() {
  const [open, setOpen] = useState(true);
  const [view, setView] = useState<"welcome" | "setup">("welcome");

  const { data: org, isLoading } = useAsyncQuery(
    queryKeys.admin.organization.detail(),
    organizationApi.getOrg,
    { retry: false },
  );

  // Org already exists → nothing to show
  if (isLoading || org !== null) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setOpen(false); }}>
      <DialogContent
        className="sm:max-w-[600px] p-0 gap-0 overflow-hidden"
        showCloseButton={false}
      >
        {/* Preload robot image */}
        <img src="/robot.png" alt="" className="hidden" fetchPriority="high" />

        <div className="relative h-[340px] sm:h-[360px]">
          {/* Background image */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/robot.png')",
              backgroundSize: "cover",
              backgroundPosition: "left center",
            }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-background/20 to-background" />

          {/* Content */}
          <div className="relative z-10 ml-auto flex h-full w-full max-w-[65%] flex-col justify-center gap-4 px-4 py-6 sm:max-w-[55%] sm:gap-5 sm:px-8 sm:py-8">
            {view === "welcome" ? (
              <WelcomeView onSetup={() => setView("setup")} onDismiss={() => setOpen(false)} />
            ) : (
              <SetupView onSuccess={() => setOpen(false)} onBack={() => setView("welcome")} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Welcome step ─────────────────────────────────────────────── */

function WelcomeView({ onSetup, onDismiss }: { onSetup: () => void; onDismiss: () => void }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">
          Welcome, Admin!
        </h2>
      </div>

      <ul className="space-y-2">
        {[
          "Set up and manage your school organization",
          "Create programs, levels, and sections",
          "Enroll students and assign educators",
          "Configure grading scales and assessments",
        ].map((f, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
            {f}
          </li>
        ))}
      </ul>

      <p className="text-sm text-muted-foreground">
        Each page has a help guide — look for the <span className="italic">Help</span> icon.
      </p>

      <div className="flex gap-2">
        <Button onClick={onSetup}>
          Create Organization
        </Button>
        <Button variant="ghost" onClick={onDismiss}>
          Not now
        </Button>
      </div>
    </>
  );
}

/* ─── Setup step ────────────────────────────────────────────────── */

function SetupView({ onSuccess, onBack }: { onSuccess: () => void; onBack: () => void }) {
  const [isPending, setIsPending] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">
          Set up your organization
        </h2>
      </div>

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
