"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useSetRegularStudent } from "@/hooks/admin/useRegularStudent";
import type { ProgramEnrollmentSnapshot } from "@/types/admin/student-enrollment.types";

interface Props {
  programEnrollment: ProgramEnrollmentSnapshot;
  schoolYearId:      string;
  studentName:       string;
  disabled?:         boolean;
}

type DialogKind = "mark" | "unmark";

const ACTION_CLASS =
  "text-xs text-muted-foreground hover:text-primary px-1.5 py-0.5 rounded hover:bg-primary/10 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed";

export function RegularStudentToggle({
  programEnrollment,
  schoolYearId,
  studentName,
  disabled = false,
}: Props): React.JSX.Element {
  const [dialog, setDialog] = useState<DialogKind | null>(null);
  const mutation = useSetRegularStudent(schoolYearId);

  const isRegular = programEnrollment.is_regular === true;
  const levelName = programEnrollment.level?.name ?? null;
  const hasLevel = levelName !== null;

  const handleConfirm = (): void => {
    if (!dialog) return;
    const markRegular = dialog === "mark";

    mutation.mutate(
      { programEnrollmentId: programEnrollment.id, isRegular: markRegular },
      {
        onSuccess: (result) => {
          if (markRegular) {
            const kept =
              result.kept_manual > 0
                ? `, ${result.kept_manual} manual record(s) left as they were`
                : "";
            toast.success(
              `Marked as regular. ${result.subjects_added} subject(s) credited${kept}.`,
            );
          } else {
            toast.success(
              `Marked as irregular. ${result.subjects_removed} automatic credit(s) removed.`,
            );
          }
          setDialog(null);
        },
        onError: (err: unknown) => {
          const e = err as AxiosError<{ message: string }>;
          toast.error(
            e?.response?.data?.message ?? "Failed to update student standing.",
          );
          setDialog(null);
        },
      },
    );
  };

  return (
    <>
      <div className="flex items-center gap-1">
        <Badge
          variant={isRegular ? "default" : "secondary"}
          className="text-xs not-interactive shrink-0"
        >
          {isRegular ? "Regular" : "Irregular"}
        </Badge>

        {!disabled && isRegular && (
          <>
            <button
              type="button"
              className={ACTION_CLASS}
              disabled={!hasLevel || mutation.isPending}
              title="Credit lower-year subjects again, for example after a year change"
              onClick={() => setDialog("mark")}
            >
              Re-sync
            </button>
            <button
              type="button"
              className={ACTION_CLASS}
              disabled={mutation.isPending}
              onClick={() => setDialog("unmark")}
            >
              Make irregular
            </button>
          </>
        )}

        {!disabled && !isRegular && (
          <button
            type="button"
            className={ACTION_CLASS}
            disabled={!hasLevel || mutation.isPending}
            title={hasLevel ? undefined : "Assign a level first"}
            onClick={() => setDialog("mark")}
          >
            Mark regular
          </button>
        )}
      </div>

      {dialog === "mark" && (
        <ConfirmDialog
          open
          title={isRegular ? "Re-sync regular student?" : "Mark as regular student?"}
          message={`Mark ${studentName} as a regular student of ${levelName ?? "this level"}?`}
          description={
            <span className="mt-2 block text-xs text-muted-foreground">
              Every subject from a lower year level in this department, including
              prerequisites, is credited as completed so the student can take any
              class in {levelName ?? "this level"}. Subjects you marked yourself
              are left untouched.
            </span>
          }
          confirmLabel={isRegular ? "Re-sync" : "Mark regular"}
          isLoading={mutation.isPending}
          onConfirm={handleConfirm}
          onOpenChange={(o) => {
            if (!o) setDialog(null);
          }}
        />
      )}

      {dialog === "unmark" && (
        <ConfirmDialog
          open
          title="Mark as irregular?"
          message={`Mark ${studentName} as an irregular student?`}
          description={
            <span className="mt-2 block text-xs text-muted-foreground">
              Subjects credited automatically by Regular standing are removed.
              Subjects you marked yourself and existing class enrollments are not
              affected.
            </span>
          }
          confirmLabel="Mark irregular"
          destructive
          isLoading={mutation.isPending}
          onConfirm={handleConfirm}
          onOpenChange={(o) => {
            if (!o) setDialog(null);
          }}
        />
      )}
    </>
  );
}