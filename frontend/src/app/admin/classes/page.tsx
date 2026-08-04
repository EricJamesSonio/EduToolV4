// ===== File: frontend\src\app\admin\classes\page.tsx =====
"use client";

import { Suspense, useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { GraduationCap, Plus } from "lucide-react";

import { classApi } from "@/api/admin/class.api";
import { subjectApi } from "@/api/admin/subject.api";
import { educatorApi } from "@/api/admin/educator.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { semesterApi } from "@/api/admin/semester.api";
import { sectionApi } from "@/api/admin/section.api";
import { programApi } from "@/api/admin/program.api";
import { levelApi } from "@/api/admin/level.api";
import { semesterTemplateApi } from "@/api/admin/semester-template.api";
import type { SchoolYear } from "@/types/admin/school-year.types";

import type { Class } from "@/types/admin/class.types";

import { PageHeader } from "@/components/shared/PageHeader";
import { HelpGuide } from "@/components/shared/help-guide/HelpGuide";
import { AsyncListState } from "@/components/shared/AsyncListState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { SchoolYearSelector } from "@/components/shared/SchoolYearSelector";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import { useClassFilters } from "@/hooks/admin/useClassFilters";
import { toArray } from "@/utils/classes.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";

import { ClassesFilterBar } from "@/components/admin/class/ClassesFilterBar";
import { ClassesTable } from "@/components/admin/class/ClassesTable";
import { CreateClassDialog } from "@/components/admin/class/CreateClassDialog";
import { useOrganizationGuard } from "@/context/OrganizationGuardContext";

function ClassesPageInner(): React.JSX.Element {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { ensureOrganization } = useOrganizationGuard();

  const defaultSubjectId: string | undefined =
    searchParams.get("subjectId") ?? undefined;

  const [createOpen, setCreateOpen] = useState(
    defaultSubjectId !== undefined
  );
  const [archiveTarget, setArchiveTarget] = useState<Class | null>(null);

  const filters = useClassFilters();

  // ===== School Years =====
  const { data: schoolYearsRaw, isLoading: isSchoolYearsLoading } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    () => schoolYearApi.getAll(),
  );

const schoolYears = toArray<SchoolYear>(schoolYearsRaw);

  // ✅ Controlled selected school year
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState<
    string | null
  >(null);


  // ===== Queries scoped to School Year =====
  const {
    data: classesRaw,
    isLoading,
    isError: classesError,
    refetch: refetchClasses,
  } = useAsyncQuery(
    queryKeys.admin.classes.list({ schoolYearId: selectedSchoolYearId, ...filters.query }),
    () =>
      classApi.getAll({
        ...filters.query,
        schoolYearId: selectedSchoolYearId!,
      }),
    { enabled: !!selectedSchoolYearId },
  );

  const { data: sectionsRaw } = useAsyncQuery(
    queryKeys.admin.sections.list({ schoolYearId: selectedSchoolYearId }),
    () => sectionApi.getAll(selectedSchoolYearId!),
    { enabled: !!selectedSchoolYearId },
  );

  const { data: subjectsRaw } = useAsyncQuery(
    queryKeys.admin.subjects.all,
    () => subjectApi.getAll(),
  );

  const { data: educatorsRaw } = useAsyncQuery(
    queryKeys.admin.educators.list(),
    () => educatorApi.getAll(),
    { staleTime: 5 * 60 * 1000 },
  );

  const { data: semestersRaw } = useAsyncQuery(
    queryKeys.admin.semesters.list(),
    () => semesterApi.getAll(),
  );

  // ── Pre-fetch for CreateClassDialog ──────────────────────────────────────────
  const { data: programsRaw } = useAsyncQuery(
    queryKeys.admin.programs.list({ schoolYearId: selectedSchoolYearId }),
    () => programApi.getAll(selectedSchoolYearId!),
    { enabled: !!selectedSchoolYearId },
  );

  const { data: levelsRaw } = useAsyncQuery(
    queryKeys.admin.levels.list({ schoolYearId: selectedSchoolYearId }),
    () => levelApi.getBySchoolYear(selectedSchoolYearId!),
    { enabled: !!selectedSchoolYearId },
  );

  const { data: templateAssignmentsRaw } = useAsyncQuery(
    queryKeys.admin.semesterTemplateAssignments.list(selectedSchoolYearId!),
    () => semesterTemplateApi.getAssignmentsBySchoolYear(selectedSchoolYearId!),
    { enabled: !!selectedSchoolYearId },
  );

  // ===== Maps =====
  const subjectMap = useMemo(() => {
    const map = new Map<string, string>();
    toArray<{ id: string; title: string }>(subjectsRaw).forEach((s) =>
      map.set(s.id, s.title)
    );
    return map;
  }, [subjectsRaw]);

  const educatorMap = useMemo(() => {
    const map = new Map<string, string>();
    toArray<{ id: string; fullName: string }>(educatorsRaw).forEach((e) =>
      map.set(e.id, e.fullName)
    );
    return map;
  }, [educatorsRaw]);

  const schoolYearMap = useMemo(() => {
    const map = new Map<string, string>();
    schoolYears.forEach((sy) => map.set(sy.id, sy.name));
    return map;
  }, [schoolYears]);

  const semesterMap = useMemo(() => {
    const map = new Map<string, string>();
    toArray<{ id: string; name: string }>(semestersRaw).forEach((sem) =>
      map.set(sem.id, sem.name)
    );
    return map;
  }, [semestersRaw]);

  const sectionMap = useMemo(() => {
    const map = new Map<string, string>();
    toArray<{ id: string; name: string }>(sectionsRaw).forEach((s) =>
      map.set(s.id, s.name)
    );
    return map;
  }, [sectionsRaw]);

  // ===== Classes Transform =====
  const classes = useMemo<Class[]>(() => {
    return toArray<Class>(classesRaw).map((cls) => ({
      ...cls,
      subjectName: subjectMap.get(cls.subjectId) ?? cls.subjectName,
      educatorName: educatorMap.get(cls.educatorId) ?? cls.educatorName,
      schoolYearTitle:
        schoolYearMap.get(cls.schoolYearId) ?? cls.schoolYearTitle,
      semesterName:
        semesterMap.get(cls.semesterId) ?? cls.semesterName,
      sectionName: cls.sectionId
        ? sectionMap.get(cls.sectionId) ?? cls.sectionName
        : cls.sectionName,
      title:
        subjectMap.get(cls.subjectId) ??
        cls.subjectName ??
        cls.subjectId,
    }));
  }, [
    classesRaw,
    subjectMap,
    educatorMap,
    schoolYearMap,
    semesterMap,
    sectionMap,
  ]);

  // ===== Archive =====
  const archiveMutation = useMutation({
    mutationFn: (id: string) => classApi.archive(id),
    onSuccess: () => {
      toast.success("Class archived.");
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.classes.all });
      setArchiveTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(
        err?.response?.data?.message ?? "Failed to archive class."
      );
      setArchiveTarget(null);
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Classes"
        actions={
          <div className="flex items-center gap-2">
            <HelpGuide slug="admin_classes" />
            <SchoolYearSelector
              schoolYears={schoolYears}
              isLoading={isSchoolYearsLoading}
              selectedId={selectedSchoolYearId}
              onSelect={setSelectedSchoolYearId}
            />
          </div>
        }
      />

      {selectedSchoolYearId && (
        <div className="flex items-center justify-end gap-2">
          <Button onClick={() => ensureOrganization(() => setCreateOpen(true))} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Class
          </Button>
        </div>
      )}

<ClassesFilterBar
  filterSemesterId={filters.filterSemesterId}
  filterEducatorId={filters.filterEducatorId}
  setFilterSemesterId={filters.setFilterSemesterId}
  setFilterEducatorId={filters.setFilterEducatorId}
  schoolYearId={selectedSchoolYearId}
/>

<AsyncListState
        isLoading={isLoading}
        isError={classesError}
        isEmpty={classes.length === 0}
        onRetry={refetchClasses}
        errorTitle="Failed to load classes"
        empty={{
          icon: GraduationCap,
          title: "No classes found",
          description: "Create your first class to get started.",
          action: {
            label: "New Class",
            onClick: () => ensureOrganization(() => setCreateOpen(true)),
          },
        }}
        loading={
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        }
      >
        <ClassesTable data={classes} onArchive={setArchiveTarget} />
      </AsyncListState>

      {createOpen && (
  <CreateClassDialog
    open={createOpen}
     onClose={() => setCreateOpen(false)}
    defaultSubjectId={defaultSubjectId}
     schoolYearId={selectedSchoolYearId}
     schoolYearName={
       schoolYears.find((sy) => sy.id === selectedSchoolYearId)?.name ?? null
     }
   />
      )}

      {archiveTarget && (
        <ConfirmDialog
          open
          title="Archive this class?"
          message={`Archive "${
            archiveTarget.title ??
            archiveTarget.subjectName ??
            "this class"
          }"? It will become read-only and hidden from active views.`}
          confirmLabel="Archive Class"
          destructive
          isLoading={archiveMutation.isPending}
          onConfirm={() => archiveMutation.mutate(archiveTarget.id)}
          onOpenChange={(o) => {
            if (!o) setArchiveTarget(null);
          }}
        />
      )}
    </div>
  );
}

export default function ClassesPage(): React.JSX.Element {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      }
    >
      <ClassesPageInner />
    </Suspense>
  );
}