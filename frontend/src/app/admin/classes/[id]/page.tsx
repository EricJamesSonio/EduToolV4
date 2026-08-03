"use client";

import { use, useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { Pencil, Archive, AlertTriangle } from "lucide-react";
import { useGradingSchemeByClass } from "@/hooks/admin/useGradingSchemes";
import { classApi } from "@/api/admin/class.api";
import { subjectApi } from "@/api/admin/subject.api";
import { educatorApi } from "@/api/admin/educator.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { semesterApi } from "@/api/admin/semester.api";
import { sectionApi } from "@/api/admin/section.api";
import type { EnrollmentResponse } from "@/api/admin/class.api";
import type { Class } from "@/types/admin/class.types";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PageHeader } from "@/components/shared/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { toArray } from "@/utils/classes.utils";

import { ClassInfoCard } from "@/components/admin/class/detail/ClassInfoCard";
import { EnrolledStudentsList } from "@/components/admin/class/detail/EnrolledStudentsList";
import { EditClassDialog } from "@/components/admin/class/detail/EditClassDialog";
import { EnrollStudentDialog } from "@/components/admin/class/detail/EnrollStudentDialog";
import { ClassGradingSchemeCard } from "@/components/admin/class/detail/ClassGradingSchemeCard";

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): React.JSX.Element {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<{
    enrollmentId: string;
    studentName: string;
  } | null>(null);

  const { data: cls, isLoading: clsLoading } = useAsyncQuery(
    queryKeys.admin.classes.detail(id),
    () => classApi.getOne(id),
  );

  const { data: enrollmentsRaw, isLoading: enrollmentsLoading } = useAsyncQuery(
    queryKeys.admin.classes.enrolled(id),
    () => classApi.getEnrollments(id),
    { enabled: !!id },
  );
  const enrollments = toArray<EnrollmentResponse>(enrollmentsRaw);

  // After the enrollmentsRaw query, add:
const { data: gradingScheme, isLoading: schemeLoading } = useGradingSchemeByClass(id);

  // ── Lookup queries ────────────────────────────────────────────────────────
  const { data: subjectsRaw } = useAsyncQuery(
    queryKeys.admin.subjects.all,
    () => subjectApi.getAll(),
  );
  const { data: educatorsRaw } = useAsyncQuery(
    queryKeys.admin.educators.list(),
    () => educatorApi.getAll(),
  );
  const { data: schoolYearsRaw } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    () => schoolYearApi.getAll(),
  );
  const { data: semestersRaw } = useAsyncQuery(
    queryKeys.admin.semesters.list(),
    () => semesterApi.getAll(),
  );
  const { data: sectionsRaw } = useAsyncQuery(
    queryKeys.admin.sections.list({ schoolYearId: cls?.schoolYearId }),
    () => sectionApi.getAll(cls!.schoolYearId),
    { enabled: !!cls?.schoolYearId },
  );

  // ── Enrich cls ────────────────────────────────────────────────────────────
  const enrichedCls = useMemo<Class | undefined>(() => {
    if (!cls) return undefined;
    const subjectName     = toArray<{ id: string; title: string }>(subjectsRaw)
                              .find((s) => s.id === cls.subjectId)?.title;
    const educatorName    = toArray<{ id: string; fullName: string }>(educatorsRaw)
                              .find((e) => e.id === cls.educatorId)?.fullName;
    const schoolYearTitle = toArray<{ id: string; name: string }>(schoolYearsRaw)
                              .find((sy) => sy.id === cls.schoolYearId)?.name;
    const semesterName    = toArray<{ id: string; name: string }>(semestersRaw)
                              .find((sem) => sem.id === cls.semesterId)?.name;
    const sectionName     = cls.sectionId
                              ? toArray<{ id: string; name: string }>(sectionsRaw)
                                  .find((s) => s.id === cls.sectionId)?.name
                              : undefined;
    return {
      ...cls,
      subjectName:     subjectName     ?? cls.subjectName,
      educatorName:    educatorName    ?? cls.educatorName,
      schoolYearTitle: schoolYearTitle ?? cls.schoolYearTitle,
      semesterName:    semesterName    ?? cls.semesterName,
      sectionName:     sectionName     ?? cls.sectionName,
      title:           subjectName     ?? cls.subjectName ?? cls.subjectId,
      isArchived:      cls.status === "archived",
    };
  }, [cls, subjectsRaw, educatorsRaw, schoolYearsRaw, semestersRaw, sectionsRaw]);

  const archiveMutation = useMutation({
    mutationFn: () => classApi.archive(id),
    onSuccess: () => {
      toast.success("Class archived.");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.classes.all });
      setArchiveConfirm(false);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to archive class.");
      setArchiveConfirm(false);
    },
  });

  const removeEnrollmentMutation = useMutation({
    mutationFn: (enrollmentId: string) =>
      classApi.removeEnrollment(id, enrollmentId),
    onSuccess: () => {
      toast.success("Student removed.");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.classes.enrolled(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.classes.detail(id) });
      setRemoveTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to remove student.");
      setRemoveTarget(null);
    },
  });

  if (clsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!enrichedCls) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center not-interactive">
        Class not found.
      </p>
    );
  }

  const isArchived = enrichedCls.status === "archived";
  const enrolledCount = enrollments.length;

  return (
   <div className="space-y-6">
      <PageHeader
        title={enrichedCls.subjectName ?? "Unnamed Class"}
        breadcrumbs={[
          { label: "Admin" },
          { label: "Classes", href: "/admin/classes" },
          { label: enrichedCls.subjectName ?? "Unnamed Class" },
        ]}
        actions={
          !isArchived && (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive border-destructive/20 hover:bg-destructive/10"
                onClick={() => setArchiveConfirm(true)}
              >
                <Archive className="mr-1.5 h-3.5 w-3.5" /> Archive
              </Button>
            </div>
          )
        }
      />

      {isArchived && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-300/40 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-700 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="not-interactive">This class is archived and read-only.</span>
        </div>
      )}

      <div className="text-sm text-muted-foreground -mt-4 not-interactive">
        {[enrichedCls.semesterName, enrichedCls.sectionName].filter(Boolean).join(" · ")}
      </div>

      <ClassInfoCard cls={enrichedCls} enrolledCount={enrolledCount} />

<ClassGradingSchemeCard
  classId={id}
  scheme={gradingScheme ?? null}
  isLoading={schemeLoading}
  isArchived={isArchived}
/>
      <EnrolledStudentsList
        enrollments={enrollments}
        isLoading={enrollmentsLoading}
        enrolledCount={enrolledCount}
        isArchived={isArchived}
        onEnroll={() => setEnrollOpen(true)}
        onRemove={setRemoveTarget}
      />

      {editOpen && (
        <EditClassDialog
          cls={enrichedCls}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          schoolYearId={enrichedCls.schoolYearId} 
        />
      )}

      {enrollOpen && (
        <EnrollStudentDialog
          classId={id}
          open={enrollOpen}
          onClose={() => setEnrollOpen(false)}
        />
      )}

      {archiveConfirm && (
        <ConfirmDialog
          open
          title="Archive this class?"
          message="Archive this class? It will become read-only and hidden from active views."
          confirmLabel="Archive Class"
          destructive
          isLoading={archiveMutation.isPending}
          onConfirm={() => archiveMutation.mutate()}
          onOpenChange={(o) => { if (!o) setArchiveConfirm(false); }}
        />
      )}

      {removeTarget && (
        <ConfirmDialog
          open
          title="Remove this student?"
          message={`Remove "${removeTarget.studentName}" from this class? Their grades and submissions may be affected.`}
          confirmLabel="Remove Student"
          destructive
          isLoading={removeEnrollmentMutation.isPending}
          onConfirm={() =>
            removeEnrollmentMutation.mutate(removeTarget.enrollmentId)
          }
          onOpenChange={(o) => { if (!o) setRemoveTarget(null); }}
        />
      )}
    </div>
  );
}