"use client";

import { toast } from "sonner";
import { UserCog } from "lucide-react";
import type { AxiosError } from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useOrgEnrollmentSetting,
  useUpsertOrgEnrollmentSetting,
} from "@/hooks/admin/useOrgEnrollmentSetting";

export function EducatorOverrideSettingCard(): React.JSX.Element {
  const { data: setting, isLoading } = useOrgEnrollmentSetting();
  const mutation = useUpsertOrgEnrollmentSetting();

  const allowed = setting?.allow_educator_scheme_override ?? true;

  const handleToggle = () => {
    mutation.mutate(
      { allow_educator_scheme_override: !allowed },
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
        <UserCog className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold not-interactive">
          Educator Permissions
        </span>
      </div>

      <div className="px-5 py-3">
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-sm font-medium not-interactive">
                Allow educators to override grading schemes
              </p>
              <p className="text-xs text-muted-foreground not-interactive">
                When off, educators can only view the grading scheme of their
                classes. Schemes and scales are locked for everyone once a
                semester starts and stay fixed until it ends.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={allowed}
              disabled={mutation.isPending}
              onClick={handleToggle}
              className={`
                relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2
                border-transparent transition-colors focus-visible:outline-none
                disabled:cursor-not-allowed disabled:opacity-50
                ${allowed ? "bg-primary" : "bg-muted-foreground/30"}
              `}
            >
              <span
                className={`
                  pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow
                  transition-transform
                  ${allowed ? "translate-x-4" : "translate-x-0"}
                `}
              />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}