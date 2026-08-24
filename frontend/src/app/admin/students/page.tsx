"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { Users, Plus, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AxiosError } from "axios";

import { studentApi, DEFAULT_PAGE_SIZE } from "@/api/admin/student.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { studentEnrollmentApi } from "@/api/admin/student-enrollment.api";
import type { Student } from "@/types/admin/student.types";
import type { GetStudentsQuery } from "@/api/admin/student.api";

import { PageHeader }    from "@/components/shared/PageHeader";
import { HelpGuide }     from "@/components/shared/help-guide/HelpGuide";
import { AsyncListState } from "@/components/shared/AsyncListState";
import { Pagination }    from "@/components/shared/Pagination";
import { Skeleton }      from "@/components/ui/skeleton";
import { Button }        from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

import { StudentFilterBar }    from "@/components/admin/student/StudentFilterBar";
import { StudentTable }        from "@/components/admin/student/StudentTable";
import { CreateStudentDialog } from "@/components/admin/student/CreateStudentDialog";
import { BulkCreateStudentDialog } from "@/components/admin/student/BulkCreateStudentDialog";
import { StudentCredentialsCard } from "@/components/admin/student/StudentCredentialsCard";
import { useOrganization } from "@/hooks/admin/useOrganization";
import { useOrganizationGuard } from "@/context/OrganizationGuardContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClassAssignmentRequests } from "@/hooks/admin/useClassAssignmentRequest";

function StudentsPageInner(): React.JSX.Element {
  const router       = useRouter();
  const queryClient  = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen]     = useState(false);
  const [filters, setFilters]       = useState<GetStudentsQuery>({});
  const [page, setPage]             = useState(1);
  const [limit, setLimit]           = useState(DEFAULT_PAGE_SIZE);
  const [reviewFilter, setReviewFilter] = useState<"all" | "pending_review" | "ready">("all");
  const [resetTarget, setResetTarget] = useState<Student | null>(null);
  const [newCredentials, setNewCredentials] = useState<{
    fullName: string; email: string; studentId: string; password: string;
  } | null>(null);

  const resetMutation = useMutation({
    mutationFn: (studentId: string) => studentApi.resetPassword(studentId),
    onSuccess: (result) => {
      const student = resetTarget;
      setResetTarget(null);
      setNewCredentials({
        fullName:  student?.fullName ?? "",
        email:     student?.email ?? "",
        studentId: student?.studentId ?? "",
        password:  result.plainPassword,
      });
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to reset password.");
      setResetTarget(null);
    },
  });

  const { data: org, isLoading: orgLoading } = useOrganization();
  const { ensureOrganization } = useOrganizationGuard();
  const hasEmailExtension = !!org?.emailExtension;

  const {
    data: studentsResp,
    isLoading,
    isError,
  } = useAsyncQuery(
    [...queryKeys.admin.students.list(filters), page, limit],
    () => studentApi.getPage({ ...filters, page, limit }),
  );

  const students: Student[] = studentsResp?.data ?? [];
  const totalStudents = studentsResp?.meta?.total ?? 0;
  const totalStudentPages = studentsResp?.meta?.totalPages ?? 1;

  useEffect(() => {
    if (page > totalStudentPages) setPage(Math.max(1, totalStudentPages));
  }, [page, totalStudentPages]);

  const { data: schoolYears } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    schoolYearApi.getAll,
  );

  const activeSchoolYearId = useMemo(
    () =>
      schoolYears?.find((sy) => sy.status === "active")?.id ??
      schoolYears?.[0]?.id ??
      null,
    [schoolYears],
  );

const { data: schoolYearEnrollments } = useAsyncQuery(
  queryKeys.admin.studentEnrollment.list({ schoolYearId: activeSchoolYearId }),
  () => studentEnrollmentApi.getBySchoolYear(activeSchoolYearId!),
  { enabled: !!activeSchoolYearId },
);

const enrollmentsForYear = schoolYearEnrollments?.data ?? [];

const enrichedStudents: Student[] = useMemo(
  () =>
    students.map((s) => {
      const sye = enrollmentsForYear.find(
        (e) => e.student_id === s.id,
      );
      if (!sye?.programEnrollments?.length) return s;
      const pe =
        sye.programEnrollments.find((p) => p.status === "active") ??
        sye.programEnrollments[0];
      return {
        ...s,
        programName: pe.program?.name ?? s.programName,
        levelName: pe.level?.name ?? s.levelName,
        sectionName: pe.section?.name ?? s.sectionName,
        courseName: pe.course
          ? pe.course.code
            ? `${pe.course.code} – ${pe.course.name}`
            : pe.course.name
          : s.courseName,
        strandName: pe.strand?.name ?? s.strandName,
      };
    }),
  [students, enrollmentsForYear],
);

  const { data: reviewData } = useClassAssignmentRequests(
    reviewFilter !== "all" ? { status: reviewFilter } : undefined,
  );
  const reviewStudentIds = useMemo(() => {
    const raw = (reviewData as unknown as { data?: unknown[] } | unknown[]) as unknown;
    const list = Array.isArray(raw) ? raw : (raw as { data?: unknown[] })?.data ?? [];
    return new Set((list as { student_id?: string; studentId?: string }[]).map((r) => r.student_id ?? r.studentId).filter(Boolean) as string[]);
  }, [reviewData]);

  const displayStudents = useMemo(() => {
    if (reviewFilter === "all") return enrichedStudents;
    return enrichedStudents.filter((s) => reviewStudentIds.has(s.id));
  }, [enrichedStudents, reviewFilter, reviewStudentIds]);

  const handleSetupEmail = () => {
    router.push("/admin/organization");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        actions={<HelpGuide slug="admin_students" />}
      />

      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => ensureOrganization(() => router.push("/admin/students/import"))}
        >
          Import CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => ensureOrganization(() => setBulkOpen(true))}>
          <Users className="mr-1.5 h-4 w-4" />
          Bulk Create
        </Button>

        {!hasEmailExtension ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={handleSetupEmail}
            disabled={orgLoading}
          >
            <AlertCircle className="mr-1.5 h-4 w-4" />
            Setup Email Extension
          </Button>
        ) : (
          <Button size="sm" onClick={() => ensureOrganization(() => setCreateOpen(true))}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Student
          </Button>
        )}
      </div>

      {!hasEmailExtension && !orgLoading && (
        <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
            <span className="not-interactive">You need to set up an email extension before creating students. Go to{" "}</span>
            <button
              onClick={handleSetupEmail}
              className="underline font-semibold hover:opacity-80"
            >
              Organization Settings
            </button>
            {" "}to configure it.
          </AlertDescription>
        </Alert>
      )}

      <StudentFilterBar
        filters={filters}
        onChange={(next) => {
          setFilters(next);
          setPage(1);
        }}
      />
      <div className="flex items-center gap-2">
        <Select value={reviewFilter} onValueChange={(v) => setReviewFilter(v as never)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Review Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            <SelectItem value="pending_review">Needs Review</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
          </SelectContent>
        </Select>
        {reviewFilter !== "all" && <span className="text-xs text-muted-foreground">{displayStudents.length} matched</span>}
      </div>

      <AsyncListState
        isLoading={isLoading}
        isError={isError}
        isEmpty={displayStudents.length === 0}
        empty={{
          icon: Users,
          title: "No students found",
          description:
            hasEmailExtension
              ? "Create your first student or adjust your filters."
              : "Setup email extension first to create students.",
          action:
            hasEmailExtension
              ? { label: "New Student", onClick: () => ensureOrganization(() => setCreateOpen(true)) }
              : { label: "Setup Email Extension", onClick: handleSetupEmail },
        }}
        loading={
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        }
      >
        <>
          <StudentTable
            data={displayStudents}
            onView={(s) => router.push(`/admin/students/${s.id}`)}
            onResetPassword={setResetTarget}
          />
          <Pagination
            page={page}
            limit={limit}
            total={totalStudents}
            onPageChange={setPage}
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
            pageSizeOptions={[20, 50, 100]}
          />
        </>
      </AsyncListState>

      {createOpen && hasEmailExtension && (
        <CreateStudentDialog
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.admin.students.all });
          }}
        />
      )}

      {bulkOpen && hasEmailExtension && (
        <BulkCreateStudentDialog
          open={bulkOpen}
          onClose={() => setBulkOpen(false)}
        />
      )}

      {/* Reset password confirm */}
      <ConfirmDialog
        open={resetTarget !== null}
        onOpenChange={(o) => { if (!o) setResetTarget(null); }}
        title="Reset password?"
        message={`This will generate a new password for ${resetTarget?.fullName}. The old password will stop working immediately.`}
        confirmLabel="Reset Password"
        destructive
        isLoading={resetMutation.isPending}
        onConfirm={() => {
          if (resetTarget) resetMutation.mutate(resetTarget.id);
        }}
      />

      {/* New credentials after reset */}
      {newCredentials && (
        <StudentCredentialsCard
          open
          onClose={() => setNewCredentials(null)}
          credentials={newCredentials}
          title="Password reset successfully"
        />
      )}
    </div>
  );
}

export default function StudentsPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <StudentsPageInner />
    </Suspense>
  );
}