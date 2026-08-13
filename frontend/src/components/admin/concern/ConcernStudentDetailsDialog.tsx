"use client";

// frontend/src/components/admin/concern/ConcernStudentDetailsDialog.tsx
//
// Reusable admin view of the full student profile for the account behind a
// concern. Deliberately consumes the EXISTING student-detail data source —
// `useStudent` (studentApi.getOne) for the core profile and the same
// school-year enrollment enrichment used by the student detail page — and
// reuses `StudentInfoCard` for rendering. No new backend logic or queries.

import { useMemo } from "react";
import { UserRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { useStudent } from "@/hooks/admin/useStudents";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { studentEnrollmentApi } from "@/api/admin/student-enrollment.api";
import { StudentInfoCard } from "@/components/admin/student/detail/StudentInfoCard";

interface Props {
  studentId: string | null;
  open: boolean;
  onClose: () => void;
}

export function ConcernStudentDetailsDialog({
  studentId,
  open,
  onClose,
}: Props): React.JSX.Element {
  const activeStudentId = open ? studentId : null;
  const { data: student, isLoading: studentLoading } = useStudent(
    activeStudentId ?? "",
  );

  const { data: schoolYears } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    schoolYearApi.getAll,
    { enabled: open && !!studentId },
  );

  const activeSchoolYearId = useMemo(
    () =>
      schoolYears?.find((sy) => sy.status === "active")?.id ??
      schoolYears?.[0]?.id ??
      null,
    [schoolYears],
  );

  const activeSchoolYearIsEnded = useMemo(
    () =>
      schoolYears?.find((sy) => sy.id === activeSchoolYearId)?.status ===
      "ended",
    [schoolYears, activeSchoolYearId],
  );

  const { data: schoolYearEnrollments } = useAsyncQuery(
    queryKeys.admin.studentEnrollment.list({ schoolYearId: activeSchoolYearId }),
    () => studentEnrollmentApi.getBySchoolYear(activeSchoolYearId!),
    { enabled: open && !!studentId && !!activeSchoolYearId },
  );

  const programEnrollments = useMemo(
    () =>
      schoolYearEnrollments?.data?.filter(
        (e) => e.student_id === studentId,
      ) ?? [],
    [schoolYearEnrollments, studentId],
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student Details</DialogTitle>
          <DialogDescription>
            Full profile of the student who submitted this concern.
          </DialogDescription>
        </DialogHeader>

        {studentLoading ? (
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="flex-1 space-y-2 pt-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <Skeleton className="h-40 w-full" />
          </div>
        ) : student ? (
          <StudentInfoCard
            student={student}
            schoolYearEnrollments={programEnrollments}
            schoolYearId={activeSchoolYearId ?? ""}
            isEnded={activeSchoolYearIsEnded}
          />
        ) : (
          <EmptyState
            icon={UserRound}
            title="Student not found"
            description="This account is no longer available or is not a student account."
            className="py-10"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
