"use client";

import { use, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { useSearchParams, useRouter } from "next/navigation";
import { Pencil, KeyRound, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { AxiosError } from "axios";

import { studentApi, type StudentEnrollment } from "@/api/admin/student.api";
import { studentEnrollmentApi } from "@/api/admin/student-enrollment.api";
import { schoolYearApi } from "@/api/admin/school-year.api";

import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

import { StudentInfoCard } from "@/components/admin/student/detail/StudentInfoCard";
import { StudentEnrollmentsList } from "@/components/admin/student/detail/StudentEnrollmentsList";
import { EditStudentDialog } from "@/components/admin/student/detail/EditStudentDialog";
import { UpdateStatusDialog } from "@/components/admin/student/detail/UpdateStatusDialog";
import { ResetPasswordDialog } from "@/components/admin/student/detail/ResetPasswordDialog";
import { EnrollStudentInClassDialog } from "@/components/admin/student/detail/EnrollStudentInClassDialog";

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const searchParams = useSearchParams();
  const router = useRouter();
  const backUrl = searchParams.get("back");

  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<StudentEnrollment | null>(null);

  const { data: student, isLoading: studentLoading } = useAsyncQuery(
    queryKeys.admin.students.detail(id),
    () => studentApi.getOne(id),
  );

  const { data: enrollmentsRaw, isLoading: enrollmentsLoading } = useAsyncQuery(
    queryKeys.admin.students.enrollments(id),
    () => studentApi.getEnrollments(id),
    { enabled: !!id },
  );

  const { data: schoolYears } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    schoolYearApi.getAll,
  );

  const activeSchoolYearId =
    schoolYears?.find((sy) => sy.status === "active")?.id ??
    schoolYears?.[0]?.id ??
    null;

  const activeSchoolYearIsEnded =
    schoolYears?.find((sy) => sy.id === activeSchoolYearId)?.status === "ended";

const { data: schoolYearEnrollments } = useAsyncQuery(
  queryKeys.admin.studentEnrollment.list({ schoolYearId: activeSchoolYearId }),
  () => studentEnrollmentApi.getBySchoolYear(activeSchoolYearId!),
  { enabled: !!activeSchoolYearId },
);

const enrollments = enrollmentsRaw ?? [];
const programEnrollments = schoolYearEnrollments?.data?.filter((e) => e.student_id === id) ?? [];
  const programIds = useMemo(() => {
    const ids = new Set<string>();
    for (const e of programEnrollments) {
      for (const pe of e.programEnrollments) {
        if (pe.program_id) ids.add(pe.program_id);
      }
    }
    return Array.from(ids);
  }, [programEnrollments]);

  const removeEnrollmentMutation = useMutation({
    mutationFn: (enrollmentId: string) =>
      studentApi.removeEnrollment(id, enrollmentId),
    onSuccess: () => {
      toast.success("Enrollment removed.");
      queryClient.invalidateQueries({
        queryKey: queryKeys.admin.students.enrollments(id),
      });
      setRemoveTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(
        err?.response?.data?.message ?? "Failed to remove enrollment."
      );
      setRemoveTarget(null);
    },
  });

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
      <p className="text-sm text-muted-foreground py-12 text-center not-interactive">
        Student not found.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {backUrl && (
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => router.push(decodeURIComponent(backUrl))}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Enrollments
        </Button>
      )}

      <PageHeader
        title={student.fullName}
        breadcrumbs={[
          { label: "Admin" },
          { label: "Students", href: "/admin/students" },
          { label: student.fullName },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setStatusOpen(true)}>
              <ShieldCheck className="mr-1.5 h-4 w-4" />
              Status
            </Button>
            <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}>
              <KeyRound className="mr-1.5 h-4 w-4" />
              Reset Password
            </Button>
            <Button size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Edit
            </Button>
          </div>
        }
      />

      <StudentInfoCard
        student={student}
        schoolYearEnrollments={programEnrollments}
        schoolYearId={activeSchoolYearId ?? ""}
        isEnded={activeSchoolYearIsEnded}
      />

      <StudentEnrollmentsList
        enrollments={enrollments}
        isLoading={enrollmentsLoading}
        programIds={programIds}
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
          student={student}
          onClose={() => setResetOpen(false)}
        />
      )}

      {enrollOpen && (
        <EnrollStudentInClassDialog
          open={enrollOpen}
          studentId={id}
          programIds={programIds}
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
          onConfirm={() =>
            removeEnrollmentMutation.mutate(removeTarget.id)
          }
          onOpenChange={(o) => {
            if (!o) setRemoveTarget(null);
          }}
        />
      )}
    </div>
  );
}
