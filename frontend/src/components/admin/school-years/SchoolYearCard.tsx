// ===== File: frontend/src/app/admin/school-years/SchoolYearCard.tsx =====
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";

import { schoolYearApi } from "@/api/admin/school-year.api";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Eye, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/date.util";

import type { SchoolYear } from "@/types/admin/school-year.types";

// ---------------------------------------------------------------------------

interface Props {
  year: SchoolYear;
  hasActive: boolean;
}

type ConfirmAction = "activate" | "end";

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
};

export function SchoolYearCard({ year, hasActive }: Props): React.JSX.Element {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  const activateMutation = useMutation({
    mutationFn: () => schoolYearApi.activate(year.id),
    onSuccess: () => {
      toast.success("School year activated.");
      queryClient.invalidateQueries({ queryKey: ["admin", "school-years"] });
      setConfirmAction(null);
    },
    onError: (err: unknown) => {
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
      queryClient.invalidateQueries({ queryKey: ["admin", "school-years"] });
      setConfirmAction(null);
    },
    onError: () => {
      toast.error("Failed to end school year.");
      setConfirmAction(null);
    },
  });

  const isMutating = activateMutation.isPending || endMutation.isPending;

  const handleConfirm = () => {
    if (confirmAction === "activate") activateMutation.mutate();
    else if (confirmAction === "end") endMutation.mutate();
  };

  const getStatusIcon = () => {
    if (year.status === "active") {
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    }
    if (year.status === "archived") {
      return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
    return <Calendar className="h-5 w-5 text-primary" />;
  };

  return (
    <>
      <div
        className={cn(
          "rounded-xl border bg-card p-6 space-y-4",
          year.status === "active" && "border-primary/30 bg-primary/5"
        )}
      >
        {/* Header with Icon and Info */}
        <div className="flex items-start gap-3">
          <div className="icon-container icon-edu shrink-0 mt-0.5">
            {getStatusIcon()}
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-semibold text-lg leading-tight">{year.name}</h3>
            {(year.start_date || year.end_date) && (
              <p className="text-sm text-muted-foreground">
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/school-years/${year.id}`)}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            View
          </Button>

          {year.status === "pending" && !hasActive && (
            <Button
              variant="outline"
              size="sm"
              className="text-primary border-primary/30 hover:bg-primary/10"
              onClick={() => setConfirmAction("activate")}
              disabled={isMutating}
            >
              Set Active
            </Button>
          )}

          {year.status === "active" && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive/20 hover:bg-destructive/10"
              onClick={() => setConfirmAction("end")}
              disabled={isMutating}
            >
              End School Year
            </Button>
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
    </>
  );
}