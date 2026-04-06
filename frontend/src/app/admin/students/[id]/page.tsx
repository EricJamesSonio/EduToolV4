"use client";

import { use, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { AxiosError } from "axios";

import { studentApi, type StudentEnrollment } from "@/api/admin/student.api";
import { levelApi } from "@/api/admin/level.api";
import { sectionApi } from "@/api/admin/section.api";
import { schoolYearApi } from "@/api/admin/school-year.api"; // ✅ added

import { toArray } from "@/utils/classes.utils";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { StudentDetailHeader } from "@/components/admin/student/detail/StudentDetailHeader";
import { StudentInfoCard } from "@/components/admin/student/detail/StudentInfoCard";
import { StudentEnrollmentsList } from "@/components/admin/student/detail/StudentEnrollmentsList";
import { EditStudentDialog } from "@/components/admin/student/detail/EditStudentDialog";
import { UpdateStatusDialog } from "@/components/admin/student/detail/UpdateStatusDialog";
import { ResetPasswordDialog } from "@/components/admin/student/detail/ResetPasswordDialog";
import { EnrollStudentInClassDialog } from "@/components/admin/student/detail/EnrollStudentInClassDialog";

// ── Normalised shapes ───────────────────────────────────────────────────────
export interface NormalisedLevel {
  id: string;
  name: string;
}

export interface NormalisedSection {
  id: string;
  name: string;
  levelId: string;
}

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [removeTarget, setRemoveTarget] =
    useState<StudentEnrollment | null>(null);

  // ── fetching ──────────────────────────────────────────────────────────────
  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ["admin", "students", id],
    queryFn: () => studentApi.getOne(id),
  });

  const { data: enrollmentsRaw, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["admin", "students", id, "enrollments"],
    queryFn: () => studentApi.getEnrollments(id),
    enabled: !!id,
  });

  const { data: levelsRaw } = useQuery({
    queryKey: ["admin", "levels", "all"],
    queryFn: () => levelApi.getAll(),
  });

  // ✅ NEW: School Years Query
  const { data: schoolYearsRaw } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn: () => schoolYearApi.getAll(),
  });

  // ✅ NEW: Active School Year
  const activeSchoolYearId = useMemo(() => {
    const arr = toArray<{ id: string; status: string }>(schoolYearsRaw);
    return (
      arr.find((sy) => sy.status === "active")?.id ??
      arr[0]?.id ??
      null
    );
  }, [schoolYearsRaw]);

  // ✅ UPDATED: Sections Query (scoped)
  const { data: sectionsRaw } = useQuery({
    queryKey: ["admin", "sections", activeSchoolYearId],
    queryFn: () => sectionApi.getAll(activeSchoolYearId!),
    enabled: !!activeSchoolYearId,
  });

  // ── normalise ─────────────────────────────────────────────────────────────
  const levels = useMemo<NormalisedLevel[]>(() => {
    return toArray<{ id: string; name: string }>(levelsRaw).map((l) => ({
      id: l.id,
      name: l.name,
    }));
  }, [levelsRaw]);

  const sections = useMemo<NormalisedSection[]>(() => {
    return toArray<{ id: string; name: string; level_id: string }>(
      sectionsRaw,
    ).map((s) => ({
      id: s.id,
      name: s.name,
      levelId: s.level_id,
    }));
  }, [sectionsRaw]);

  const enrollments = toArray<StudentEnrollment>(enrollmentsRaw);

  // ── lookups ───────────────────────────────────────────────────────────────
  const levelName = useMemo(
    () => levels.find((l) => l.id === student?.levelId)?.name,
    [student, levels],
  );

  const sectionName = useMemo(
    () => sections.find((s) => s.id === student?.sectionId)?.name,
    [student, sections],
  );

  // ── mutations ─────────────────────────────────────────────────────────────
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
      toast.error(
        err?.response?.data?.message ?? "Failed to remove enrollment.",
      );
      setRemoveTarget(null);
    },
  });

  // ── render ────────────────────────────────────────────────────────────────
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
        levelName={levelName}
        sectionName={sectionName}
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
          levels={levels}
          sections={sections}
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
          onOpenChange={(o) => {
            if (!o) setRemoveTarget(null);
          }}
        />
      )}
    </div>
  );
}