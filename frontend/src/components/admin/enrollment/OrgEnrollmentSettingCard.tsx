"use client";

import { useOrgEnrollmentSetting, useUpsertOrgEnrollmentSetting } from "@/hooks/admin/useOrgEnrollmentSetting";
import { toast } from "sonner";
import { Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AxiosError } from "axios";

interface ToggleRowProps {
  label:       string;
  description: string;
  checked:     boolean;
  disabled:    boolean;
  onChange:    (v: boolean) => void;
}

function ToggleRow({ label, description, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2
          border-transparent transition-colors focus-visible:outline-none
          disabled:cursor-not-allowed disabled:opacity-50
          ${checked ? "bg-primary" : "bg-muted-foreground/30"}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow
            transition-transform
            ${checked ? "translate-x-4" : "translate-x-0"}
          `}
        />
      </button>
    </div>
  );
}

export function OrgEnrollmentSettingCard() {
  const { data: setting, isLoading } = useOrgEnrollmentSetting();
  const mutation = useUpsertOrgEnrollmentSetting();

  const handleToggle = (field: "require_semester_reenrollment" | "auto_unenroll_on_year_end") => {
    if (!setting) return;
    mutation.mutate(
      { ...setting, [field]: !setting[field] },
      {
        onSuccess: () => toast.success("Setting updated."),
        onError: (err: unknown) => {
          const e = err as AxiosError<{ message: string }>;
          toast.error(e?.response?.data?.message ?? "Failed to update setting.");
        },
      },
    );
  };

  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 px-5 py-4 border-b">
        <Settings className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Enrollment Settings</span>
      </div>

      <div className="px-5 divide-y">
        {isLoading ? (
          <div className="space-y-4 py-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <>
            <ToggleRow
              label="Auto-unenroll on year end"
              description="Automatically remove students from all classes when a school year ends."
              checked={setting?.auto_unenroll_on_year_end ?? true}
              disabled={mutation.isPending}
              onChange={() => handleToggle("auto_unenroll_on_year_end")}
            />
            <ToggleRow
              label="Require semester re-enrollment"
              description="Students must be re-enrolled each semester to access classes."
              checked={setting?.require_semester_reenrollment ?? false}
              disabled={mutation.isPending}
              onChange={() => handleToggle("require_semester_reenrollment")}
            />
          </>
        )}
      </div>
    </div>
  );
}