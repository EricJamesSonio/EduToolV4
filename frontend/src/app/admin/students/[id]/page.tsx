"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast }          from "sonner";
import type { AxiosError } from "axios";

import { studentApi, type StudentEnrollment } from "@/api/admin/student.api";
import { studentEnrollmentApi }               from "@/api/admin/student-enrollment.api";
import { schoolYearApi }                      from "@/api/admin/school-year.api";

import { Skeleton }       from "@/components/ui/skeleton";
import { ConfirmDialog }  from "@/components/shared/ConfirmDialog";

import { StudentDetailHeader }      from "@/components/admin/student/detail/StudentDetailHeader";
import { StudentInfoCard }          from "@/components/admin/student/detail/StudentInfoCard";
import { StudentEnrollmentsList }   from "@/components/admin/student/detail/StudentEnrollmentsList";
import { EditStudentDialog }        from "@/components/admin/student/detail/EditStudentDialog";
import { UpdateStatusDialog }       from "@/components/admin/student/detail/UpdateStatusDialog";
import { ResetPasswordDialog }      from "@/components/admin/student/detail/ResetPasswordDialog";
import { EnrollStudentInClassDialog } from "@/components/admin/student/detail/EnrollStudentInClassDialog";

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element {
  const { id }         = use(params);
  const queryClient    = useQueryClient();

  const [editOpen,    setEditOpen]    = useState(false);
  const [statusOpen,  setStatusOpen]  = useState(false);
  const [resetOpen,   setResetOpen]   = useState(false);
  const [enrollOpen,  setEnrollOpen]  = useState(false);
  const [removeTarget, setRemoveTarget] = useState<StudentEnrollment | null>(null);

  // ── Student account ──────────────────────────────────────────────────────
  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ["admin", "students", id],
    queryFn:  () => studentApi.getOne(id),
  });

  // ── Class enrollments (for the enrollments list / remove action) ─────────
  const { data: enrollmentsRaw, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["admin", "students", id, "enrollments"],
    queryFn:  () => studentApi.getEnrollments(id),
    enabled:  !!id,
  });

  // ── School-year enrollments (for the info card: program/level/course etc) ─
  const { data: schoolYears } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn:  schoolYearApi.getAll,
  });

  // Fetch all school-year enrollment records for this student by querying
  // each school year that exists. We pick the active one first; the info card
  // will show all program enrollments across active/pending school years.
  const activeSchoolYearId =
    schoolYears?.find((sy) => sy.status === "active")?.id ??
    schoolYears?.[0]?.id ??
    null;

  const { data: schoolYearEnrollments } = useQuery({
    queryKey: ["admin", "school-year-enrollments", activeSchoolYearId],
    queryFn:  () => studentEnrollmentApi.getBySchoolYear(activeSchoolYearId!),
    enabled:  !!activeSchoolYearId,
    select:   (data) => data.filter((e) => e.student_id === id),
  });

  const enrollments = enrollmentsRaw ?? [];
  const programEnrollments = schoolYearEnrollments ?? [];

  // ── Remove class enrollment ──────────────────────────────────────────────
  const removeEnrollmentMutation = useMutation({
    mutationFn: (enrollmentId: string) =>
      studentApi.removeEnrollment(id, enrollmentId),
    onSuccess: () => {
      toast.success("Enrollment removed.");
      queryClient.invalidateQueries({
        queryKey: ["admin", "students", id, "enrollments"],
      });
      setRemoveTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to remove enrollment.");
      setRemoveTarget(null);
    },
  });

  // ── Loading / not found ──────────────────────────────────────────────────
  if (studentLoading) {
    return (
      <div className="space-y-4 max-w-4xl">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!student) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        Student not found.
      </p>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <StudentDetailHeader
        student={student}
        onEdit={() => setEditOpen(true)}
        onResetPassword={() => setResetOpen(true)}
        onUpdateStatus={() => setStatusOpen(true)}
      />

      <StudentInfoCard
        student={student}
        schoolYearEnrollments={programEnrollments}
      />

      <StudentEnrollmentsList
        enrollments={enrollments}
        isLoading={enrollmentsLoading}
        onEnroll={() => setEnrollOpen(true)}
        onRemove={setRemoveTarget}
      />

      {editOpen && (
        <EditStudentDialog
          open={editOpen}
          student={student}
          onClose={() => setEditOpen(false)}
        />
      )}

      {statusOpen && (
        <UpdateStatusDialog
          open={statusOpen}
          student={student}
          onClose={() => setStatusOpen(false)}
        />
      )}

      {resetOpen && (
        <ResetPasswordDialog
          open={resetOpen}
          studentId={student.id}
          studentName={student.fullName}
          onClose={() => setResetOpen(false)}
        />
      )}

      {enrollOpen && (
        <EnrollStudentInClassDialog
          open={enrollOpen}
          studentId={id}
          onClose={() => setEnrollOpen(false)}
        />
      )}

      {removeTarget && (
        <ConfirmDialog
          open
          title="Remove enrollment?"
          message="Remove this student from this class? This cannot be undone."
          confirmLabel="Remove"
          destructive
          isLoading={removeEnrollmentMutation.isPending}
          onConfirm={() => removeEnrollmentMutation.mutate(removeTarget.id)}
          onOpenChange={(o) => { if (!o) setRemoveTarget(null); }}
        />
      )}
    </div>
  );
}