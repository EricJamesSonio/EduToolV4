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
import { Eye } from "lucide-react";

import type { SchoolYear } from "@/types/admin/school-years.types";
import { cn } from "@/lib/utils";
import { formatDate } from "@/utils/date.util";

interface Props {
  year: SchoolYear;
  hasActive: boolean;
}

type ConfirmAction = "activate" | "end";

const ACTION_BTN =
  "border-[3px] border-black bg-white text-black hover:bg-black hover:text-white transition-colors";

const ACTIVE_CARD =
  "bg-neutral-100 border-black"; // 👈 subtle grey active state

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
        ? err.response?.data?.message ?? "Failed to activate."
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
    if (confirmAction === "end") endMutation.mutate();
  };

  return (
    <>
      <div
        className={cn(
          "border-[3px] border-black bg-white p-5 space-y-4 transition-colors",
          year.status === "active" && ACTIVE_CARD
        )}
      >
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="font-bold text-base uppercase tracking-wide">
              {year.name}
            </h3>

            {(year.start_date || year.end_date) && (
              <p className="text-xs text-muted-foreground">
                {year.start_date ? formatDate(year.start_date) : "—"} –{" "}
                {year.end_date ? formatDate(year.end_date) : "—"}
              </p>
            )}
          </div>

          <StatusBadge status={year.status} />
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => router.push(`/admin/school-years/${year.id}`)}
            className={cn(ACTION_BTN)}
          >
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>

          {year.status === "pending" && !hasActive && (
            <Button
              size="sm"
              className={cn(ACTION_BTN)}
              onClick={() => setConfirmAction("activate")}
              disabled={isMutating}
            >
              Set Active
            </Button>
          )}

          {year.status === "active" && (
            <Button
              size="sm"
              className={cn(
                ACTION_BTN,
                "border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
              )}
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
          title={
            confirmAction === "activate"
              ? "Activate this school year?"
              : "End this school year?"
          }
          message={
            confirmAction === "activate"
              ? "This will make it the active school year."
              : "It will become archived and read-only."
          }
          confirmLabel={confirmAction === "activate" ? "Activate" : "End"}
          destructive={confirmAction === "end"}
          isLoading={isMutating}
          onConfirm={handleConfirm}
          onOpenChange={(o) => !o && setConfirmAction(null)}
        />
      )}
    </>
  );
}