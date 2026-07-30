"use client";

import { useState } from "react";

import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Building2 } from "lucide-react";
import { organizationApi } from "@/api/admin/organization.api";

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
  const { register, handleSubmit, formState: { errors } } = useForm<{
    name: string;
    description: string;
  }>({ defaultValues: { name: "", description: "" } });

  const mutation = useMutationWithInvalidation(
    organizationApi.createOrg,
    {
      invalidateKeys: [
        queryKeys.admin.organization.detail(),
        queryKeys.admin.analytics.dashboard(),
      ],
      onSuccess: () => {
        toast.success("Organization created! Welcome to Relief-ED.");
        onSuccess();
      },
      onError: () => toast.error("Failed to create organization."),
    }
  );

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

      <form
        onSubmit={handleSubmit((v) =>
          mutation.mutate({ name: v.name, description: v.description || undefined })
        )}
        className="space-y-3"
      >
        <div className="space-y-1.5">
          <Label htmlFor="org-name">School / Organization Name</Label>
          <Input
            id="org-name"
            placeholder="e.g. St. Mary's Academy"
            {...register("name", {
              required: "Name is required",
              minLength: { value: 2, message: "At least 2 characters" },
            })}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="org-desc">
            Description{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="org-desc"
            placeholder="A brief description of your school..."
            rows={3}
            {...register("description")}
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating..." : "Create Organization"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            disabled={mutation.isPending}
          >
            Back
          </Button>
        </div>
      </form>
    </>
  );
}
