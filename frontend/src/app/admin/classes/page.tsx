// ===== File: frontend\src\app\admin\classes\page.tsx =====
"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import { GraduationCap, Plus } from "lucide-react";
import { useClassPreset } from "@/hooks/admin/useClassPreset";
import { ClassPresetButton } from "@/components/admin/class/ClassPresetButton";

import { classApi, DEFAULT_PAGE_SIZE } from "@/api/admin/class.api";
import type { PaginatedResponse } from "@/types/api.types";
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
import { Pagination } from "@/components/shared/Pagination";

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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);

  const filters = useClassFilters();

  const {
    filterProgramId,
    filterSemesterId,
    filterEducatorId,
    search,
    setFilterProgramId,
    setFilterSemesterId,
    setFilterEducatorId,
    setDepartmentAndSemester,
    setSearch,
    resetSemester,
    query,
  } = filters;

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
    data: classesResp,
    isLoading,
    isError: classesError,
  } = useAsyncQuery<PaginatedResponse<Class>>(
    [
      ...queryKeys.admin.classes.list({
        schoolYearId: selectedSchoolYearId,
        ...filters.query,
      }),
      page,
      limit,
    ],
    () =>
      classApi.getPage({
        ...filters.query,
        schoolYearId: selectedSchoolYearId!,
        page,
        limit,
      }),
    { enabled: !!selectedSchoolYearId },
  );

  const totalClasses =
    classesResp?.meta?.total ?? 0;
  const totalClassPages =
    classesResp?.meta?.totalPages ?? 1;

  useEffect(() => {
    if (page > totalClassPages) setPage(Math.max(1, totalClassPages));
  }, [page, totalClassPages]);

  useEffect(() => {
    setPage(1);
  }, [selectedSchoolYearId]);

  const handleFilterSemesterChange: React.Dispatch<React.SetStateAction<string>> = (value) => {
    filters.setFilterSemesterId(value);
    setPage(1);
  };
  const handleFilterEducatorChange: React.Dispatch<React.SetStateAction<string>> = (value) => {
    filters.setFilterEducatorId(value);
    setPage(1);
  };

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

   const { data: programsRaw } = useAsyncQuery(
     queryKeys.admin.programs.list({ schoolYearId: selectedSchoolYearId }),
     () => programApi.getAll(selectedSchoolYearId!),
     { enabled: !!selectedSchoolYearId },
   );
  const programsForPreset = toArray<{ id: string; name: string }>(programsRaw);

  const { preset, savePreset, setEnabled, clearPreset } = useClassPreset(selectedSchoolYearId);

  // Only trust the preset if its department still exists for this school year.
  const presetActive =
    !!preset?.enabled && programsForPreset.some((p) => p.id === preset.programId);

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
    return toArray<Class>(classesResp?.data).map((cls) => ({
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
        "Unnamed Class",
    }));
  }, [
    classesResp,
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
          <ClassPresetButton
            schoolYearId={selectedSchoolYearId}
            preset={preset}
            savePreset={savePreset}
            setEnabled={setEnabled}
            clearPreset={clearPreset}
          />
          <Button onClick={() => ensureOrganization(() => setCreateOpen(true))} size="sm">
            <Plus className="mr-1.5 h-4 w-4" />
            New Class
          </Button>
        </div>
      )}

<ClassesFilterBar
  filterProgramId={filterProgramId}
  filterSemesterId={filterSemesterId}
  filterEducatorId={filterEducatorId}
  search={search}
  setFilterProgramId={setFilterProgramId}
  setFilterSemesterId={setFilterSemesterId}
  setFilterEducatorId={setFilterEducatorId}
  setDepartmentAndSemester={setDepartmentAndSemester}
  setSearch={setSearch}
  schoolYearId={selectedSchoolYearId}
/>

<AsyncListState
        isLoading={isLoading}
        isError={classesError}
        isEmpty={classes.length === 0}
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
        <Pagination
          page={page}
          limit={limit}
          total={totalClasses}
          onPageChange={setPage}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
          pageSizeOptions={[20, 50, 100]}
        />
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
          defaultProgramId={presetActive ? preset!.programId : undefined}
     defaultSemesterId={presetActive ? preset!.semesterId : undefined}
     defaultTrackId={presetActive ? preset!.trackId : undefined}
     defaultLevelId={presetActive ? preset!.levelId : undefined}
     defaultSectionId={presetActive ? preset!.sectionId : undefined}
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