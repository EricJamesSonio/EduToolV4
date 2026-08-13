"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CircleAlert, CheckCircle2, Loader2 } from "lucide-react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { schoolYearApi } from "@/api/admin/school-year.api";
import type { SchoolYearReadiness } from "@/types/admin/school-year.types";

interface SchoolYearReadinessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolYearId: string;
  /** Pre-load the detail at the call site to render instantly (avoids a flash). */
  readiness?: SchoolYearReadiness | null;
}

export function SchoolYearReadinessDialog({
  open,
  onOpenChange,
  schoolYearId,
  readiness: providedReadiness = null,
}: SchoolYearReadinessDialogProps) {
  const shouldFetch = !providedReadiness;
  const { data: fetchedReadiness, isLoading } = useAsyncQuery<SchoolYearReadiness>(
    queryKeys.admin.schoolYears.readinessDetail(schoolYearId),
    () => schoolYearApi.getReadiness(schoolYearId),
    { enabled: shouldFetch && open && !!schoolYearId },
  );

  const readiness = providedReadiness ?? fetchedReadiness;
  const blocking = readiness?.issues.filter((i) => i.severity === "blocking") ?? [];
  const warnings = readiness?.issues.filter((i) => i.severity === "warning") ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950/40">
              <CircleAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <DialogTitle>School Year Not Ready</DialogTitle>
              <DialogDescription className="mt-1">
                This school year cannot be activated yet. Resolve the items below
                before setting it active.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking readiness…
            </div>
          ) : (
            <>
              {blocking.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 not-interactive">
                    Blocking issue{blocking.length > 1 ? "s" : ""}
                  </p>
                  <ul className="space-y-1.5">
                    {blocking.map((issue, i) => (
                      <li
                        key={issue.ref?.id ?? `${issue.code}-${i}`}
                        className="rounded-lg border bg-card px-3 py-2.5 text-sm"
                      >
                        <div className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-start gap-2">
                              <span className="text-foreground">{issue.message}</span>
                              {typeof issue.count === "number" && (
                                <span className="ml-auto shrink-0 rounded-full bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                                  {issue.count}
                                </span>
                              )}
                            </div>
                            {issue.entities && issue.entities.length > 0 && (
                              <div className="mt-1.5 flex flex-wrap gap-1">
                                {issue.entities.map((e) => (
                                  <span
                                    key={e.id}
                                    className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
                                  >
                                    {e.name}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground not-interactive">
                    Warning{warnings.length > 1 ? "s" : ""}
                  </p>
                  <ul className="space-y-1.5">
                    {warnings.map((issue, i) => (
                      <li key={issue.ref?.id ?? `${issue.code}-${i}`} className="flex items-start gap-2 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0" />
                        <span className="text-muted-foreground">{issue.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {blocking.length === 0 && warnings.length === 0 && (
                <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  This school year appears ready to use.
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}