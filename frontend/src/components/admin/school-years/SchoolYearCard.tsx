// ===== File: frontend/src/app/admin/school-years/SchoolYearCard.tsx =====
"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";

import { schoolYearApi } from "@/api/admin/school-year.api";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SchoolYearReadinessDialog } from "./SchoolYearReadinessDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  ListItemCardAction,
  listItemCardClass,
  listItemIconClass,
  listItemTitleClass,
} from "@/components/shared/ListItemCard";
import { Eye, Calendar, CalendarX2, CheckCircle2, AlertCircle, CircleAlert, Trash2, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/date.util";

import type { SchoolYear, SchoolYearReadiness, ReadinessSummary } from "@/types/admin/school-year.types";

// ---------------------------------------------------------------------------

interface Props {
  year: SchoolYear;
  hasActive: boolean;
  readiness?: ReadinessSummary;
}

type ConfirmAction = "activate" | "end" | "delete";

interface ConfirmCopy {
  title: string;
  message: string;
  confirmLabel: string;
  destructive: boolean;
}

const CONFIRM_COPY: Record<ConfirmAction, ConfirmCopy> = {
  activate: {
    title: "Activate this school year?",
    message: "This will make it the active school year. This cannot be undone.",
    confirmLabel: "Activate",
    destructive: false,
  },
  end: {
    title: "End this school year?",
    message: "It will become read-only and archived. This cannot be undone.",
    confirmLabel: "End School Year",
    destructive: true,
  },
  delete: {
    title: "Delete this school year?",
    message: "This will permanently remove this unused school year. This cannot be undone.",
    confirmLabel: "Delete School Year",
    destructive: true,
  },
};

export function SchoolYearCard({ year, hasActive, readiness }: Props): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [readinessOpen, setReadinessOpen] = useState(false);
  const [preparedReadiness, setPreparedReadiness] =
    useState<SchoolYearReadiness | null>(null);

  // The list summary (`readiness`) is coarse and can miss deep blocking issues
  // (e.g. "Level has no subjects"). For pending years we load the authoritative
  // readiness detail once so the button is grayed accurately and the click
  // shows the real reasons immediately.
  useEffect(() => {
    if (year.status !== "pending" || hasActive) return;
    let active = true;
    schoolYearApi
      .getReadiness(year.id)
      .then((d) => {
        if (active) setPreparedReadiness(d);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [year.id, year.status, hasActive]);

  const notReady = preparedReadiness
    ? !preparedReadiness.ready
    : readiness
      ? !readiness.ready
      : false;

const invalidateSchoolYears = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.admin.schoolYears.all });
    queryClient.invalidateQueries({ queryKey: ["admin", "school-years"] });
  };

  const removeFromCache = () => {
    const removeYear = (old: SchoolYear[] | undefined) =>
      old?.filter((y) => y.id !== year.id);
    queryClient.setQueryData(queryKeys.admin.schoolYears.list(), removeYear);
    queryClient.setQueryData(["admin", "school-years"], removeYear);
  };

  const activateMutation = useMutation({
    mutationFn: () => schoolYearApi.activate(year.id),
    onSuccess: () => {
      toast.success("School year activated.");
      invalidateSchoolYears();
      setConfirmAction(null);
    },
    onError: (err: unknown) => {
      if (isAxiosError(err)) {
        const data = err.response?.data as
          | { issues?: SchoolYearReadiness["issues"] }
          | undefined;
        if (Array.isArray(data?.issues) && data.issues.length > 0) {
          // Mark-ready was rejected because the school year is not ready.
          // Surface the backend's checklist instead of a generic error toast.
          const blockingCount = data.issues.filter((i) => i.severity === "blocking").length;
          setPreparedReadiness({
            ready: false,
            blockingCount,
            warningCount: data.issues.length - blockingCount,
            issues: data.issues,
          });
          setReadinessOpen(true);
          setConfirmAction(null);
          return;
        }
      }
      const msg = isAxiosError(err)
        ? (err.response?.data?.message ?? "Failed to activate.")
        : "Failed to activate.";
      toast.error(msg);
      setConfirmAction(null);
    },
  });

  const endMutation = useMutation({
    mutationFn: () => schoolYearApi.end(year.id),
    onSuccess: () => {
      toast.success("School year ended.");
      invalidateSchoolYears();
      setConfirmAction(null);
    },
    onError: () => {
      toast.error("Failed to end school year.");
      setConfirmAction(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => schoolYearApi.remove(year.id),
    onSuccess: () => {
      toast.success("School year deleted.");
      removeFromCache();
      invalidateSchoolYears();
      setConfirmAction(null);
    },
    onError: (err: unknown) => {
      const msg = isAxiosError(err)
        ? (err.response?.data?.message ?? "Failed to delete school year.")
        : "Failed to delete school year.";
      toast.error(msg);
      setConfirmAction(null);
    },
  });

  const isMutating =
    activateMutation.isPending || endMutation.isPending || deleteMutation.isPending;

  const handleSetActiveClick = async () => {
    if (isMutating) return;
    try {
      const detail =
        preparedReadiness ?? (await schoolYearApi.getReadiness(year.id));
      if (detail.ready) {
        setConfirmAction("activate");
      } else {
        setPreparedReadiness(detail);
        setReadinessOpen(true);
      }
    } catch {
      setConfirmAction("activate");
    }
  };

  const handleCheckReadinessClick = async () => {
    if (isMutating) return;
    try {
      const detail =
        preparedReadiness ?? (await schoolYearApi.getReadiness(year.id));
      setPreparedReadiness(detail);
      setReadinessOpen(true);
    } catch {
      toast.error("Failed to load readiness.");
    }
  };

  const handleConfirm = () => {
    if (confirmAction === "activate") activateMutation.mutate();
    else if (confirmAction === "end") endMutation.mutate();
    else if (confirmAction === "delete") deleteMutation.mutate();
  };

  const getStatusIcon = () => {
    if (year.status === "active") {
      return <CheckCircle2 className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-emerald-500" />;
    }
    if (year.status === "ended") {
      return <AlertCircle className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-muted-foreground" />;
    }
    return <Calendar className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-primary" />;
  };

  return (
    <>
      <div
        className={cn(
          listItemCardClass,
          year.status === "active" && "border-primary/30 bg-primary/5"
        )}
      >
        {/* Header with Icon and Info */}
        <div className="flex items-start gap-3">
          <div className={cn(listItemIconClass, "icon-edu mt-0.5")}>
            {getStatusIcon()}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className={cn(listItemTitleClass, "not-interactive")}>{year.name}</h3>
              {notReady && (
                <span
                  title={
                    "This school year is not ready. Open it to see what needs attention."
                  }
                >
                  <CircleAlert className="h-4 w-4 text-amber-500 shrink-0" />
                </span>
              )}
            </div>
            {(year.start_date || year.end_date) && (
              <p className="text-sm text-muted-foreground not-interactive">
                {year.start_date ? formatDate(year.start_date) : "—"}
                {" "}–{" "}
                {year.end_date ? formatDate(year.end_date) : "—"}
              </p>
            )}
          </div>
          <StatusBadge status={year.status} className="shrink-0" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <ListItemCardAction
            icon={Eye}
            label="View"
            onClick={() => router.push(`/admin/school-years/${year.id}`)}
          />

          {year.status === "pending" && !hasActive && (
            <ListItemCardAction
              icon={CheckCircle2}
              label="Set Active"
              className={
                notReady
                  ? "text-muted-foreground border-muted-foreground/30 hover:bg-transparent cursor-not-allowed"
                  : "text-primary border-primary/30 hover:bg-primary/10"
              }
              onClick={handleSetActiveClick}
              disabled={isMutating}
            />
          )}

          {year.status === "pending" && (
            <ListItemCardAction
              icon={ListChecks}
              label="Check readiness"
              className="text-muted-foreground border-muted-foreground/20 hover:bg-muted/50"
              onClick={handleCheckReadinessClick}
              disabled={isMutating}
            />
          )}

          {year.status === "active" && (
            <ListItemCardAction
              icon={CalendarX2}
              label="End School Year"
              className="text-destructive border-destructive/20 hover:bg-destructive/10"
              onClick={() => setConfirmAction("end")}
              disabled={isMutating}
            />
          )}

          {year.status === "pending" && !year.in_use && (
            <ListItemCardAction
              icon={Trash2}
              label="Delete"
              iconOnly
              className="text-destructive border-destructive/20 hover:bg-destructive/10"
              onClick={() => setConfirmAction("delete")}
              disabled={isMutating}
            />
          )}
        </div>
      </div>

      {confirmAction && (
        <ConfirmDialog
          open
          title={CONFIRM_COPY[confirmAction].title}
          message={CONFIRM_COPY[confirmAction].message}
          confirmLabel={CONFIRM_COPY[confirmAction].confirmLabel}
          destructive={CONFIRM_COPY[confirmAction].destructive}
          isLoading={isMutating}
          onConfirm={handleConfirm}
          onOpenChange={(o) => {
            if (!o) setConfirmAction(null);
          }}
        />
      )}

      <SchoolYearReadinessDialog
        open={readinessOpen}
        onOpenChange={setReadinessOpen}
        schoolYearId={year.id}
        readiness={preparedReadiness}
      />
    </>
  );
}