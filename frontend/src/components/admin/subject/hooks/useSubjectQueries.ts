import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { programApi }    from "@/api/admin/program.api";
import { levelApi }      from "@/api/admin/level.api";
import { courseApi }     from "@/api/admin/course.api";
import { strandApi }     from "@/api/admin/strand.api";
import { educatorApi }   from "@/api/admin/educator.api";
import { subjectApi, DEFAULT_PAGE_SIZE } from "@/api/admin/subject.api";
import type { FiltersState } from "./useSubjectFilters";

export interface SubjectPageParams {
  search?: string;
  page?:   number;
  limit?:  number;
}

export function useSubjectQueries(
  filters: FiltersState,
  pageParams: SubjectPageParams = {},
) {
  const search = pageParams.search ?? "";
  const page   = pageParams.page ?? 1;
  const limit  = pageParams.limit ?? DEFAULT_PAGE_SIZE;

  const { data: schoolYears = [], isLoading: syLoading } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    schoolYearApi.getAll,
  );

  // FIX: was programApi.findAll — correct method is programApi.getAll(schoolYearId)
  const { data: programs = [], isLoading: programsLoading } = useAsyncQuery(
    queryKeys.admin.programs.list({ schoolYearId: filters.selectedSchoolYearId }),
    () => programApi.getAll(filters.selectedSchoolYearId!),
    { enabled: !!filters.selectedSchoolYearId },
  );

  const { data: levels = [], isLoading: levelsLoading } = useAsyncQuery(
    queryKeys.admin.levels.list({
      schoolYearId: filters.selectedSchoolYearId,
      programId: filters.selectedProgramId,
      courseId: filters.selectedCourseId,
      strandId: filters.selectedStrandId,
    }),
    async () => {
      if (!filters.selectedSchoolYearId) return [];
      // When a course is selected, fetch course-scoped levels
      if (filters.selectedCourseId !== "all") {
        return levelApi.getByCourse(filters.selectedSchoolYearId, filters.selectedCourseId);
      }
      // When a strand is selected, fetch strand-scoped levels
      if (filters.selectedStrandId !== "all") {
        return levelApi.getByStrand(filters.selectedSchoolYearId, filters.selectedStrandId);
      }
      // Fallback: program-scoped levels (no course_id/strand_id)
      if (filters.selectedProgramId !== "all") {
        return levelApi.getBySchoolYear(filters.selectedSchoolYearId, filters.selectedProgramId);
      }
      return levelApi.getBySchoolYear(filters.selectedSchoolYearId);
    },
    { enabled: !!filters.selectedSchoolYearId },
  );

  const { data: courses = [] } = useAsyncQuery(
    queryKeys.admin.courses.list({
      schoolYearId: filters.selectedSchoolYearId,
      programId: filters.selectedProgramId,
    }),
    () =>
      courseApi.getAll({
        schoolYearId: filters.selectedSchoolYearId!,
        programId:    filters.selectedProgramId,
      }),
    { enabled: filters.selectedProgramId !== "all" && !!filters.selectedSchoolYearId },
  );

  const { data: strands = [] } = useAsyncQuery(
    queryKeys.admin.strands.list({ program_id: filters.selectedProgramId }),
    () => strandApi.getAll({ program_id: filters.selectedProgramId }),
    { enabled: filters.selectedProgramId !== "all" },
  );

  const { data: educators = [], isLoading: educatorsLoading } = useAsyncQuery(
    queryKeys.admin.educators.list({}),
    () => educatorApi.getAll(),
    { select: (data) => (Array.isArray(data) ? data : []) },
  );

  const listFilters = {
    schoolYearId: filters.selectedSchoolYearId!,
    programId:
      filters.selectedProgramId !== "all"
        ? filters.selectedProgramId
        : undefined,
    levelId:
      filters.filterLevelId !== "all" ? filters.filterLevelId : undefined,
    courseId:
      filters.selectedCourseId !== "all"
        ? filters.selectedCourseId
        : undefined,
    strandId:
      filters.selectedStrandId !== "all"
        ? filters.selectedStrandId
        : undefined,
    subjectType: filters.activeTab,
    search: search || undefined,
  };

  const { data: subjectsResp, isLoading: subjectsLoading } = useAsyncQuery(
    [...queryKeys.admin.subjects.list(listFilters), page, limit],
    () => subjectApi.getPage({ ...listFilters, page, limit }),
    { enabled: !!filters.selectedSchoolYearId },
  );

  return {
    schoolYears, syLoading,
    programs, programsLoading,
    levels, levelsLoading,
    courses, strands,
    educators, educatorsLoading,
    subjects: subjectsResp?.data ?? [],
    subjectsTotal: subjectsResp?.meta?.total ?? 0,
    subjectsTotalPages: subjectsResp?.meta?.totalPages ?? 1,
    subjectsLoading,
  };
}
