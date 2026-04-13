import { useQuery } from "@tanstack/react-query";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { programApi } from "@/api/admin/program.api";
import { levelApi } from "@/api/admin/level.api";
import { courseApi } from "@/api/admin/course.api";
import { strandApi } from "@/api/admin/strand.api";
import { educatorApi } from "@/api/admin/educator.api";
import { subjectApi } from "@/api/admin/subject.api";
import type { FiltersState } from "./useSubjectFilters";

export function useSubjectQueries(filters: FiltersState) {
  // ━━━━━ School Years ━━━━━
  const { data: schoolYears = [], isLoading: syLoading } = useQuery({
    queryKey: ["admin", "school-years"],
    queryFn: schoolYearApi.getAll,
  });

  // ━━━━━ Programs ━━━━━
  const { data: programs = [], isLoading: programsLoading } = useQuery({
    queryKey: ["admin", "programs", filters.selectedSchoolYearId],
    queryFn: () =>
      programApi.findAll({ schoolYearId: filters.selectedSchoolYearId! }),
    enabled: !!filters.selectedSchoolYearId,
  });

  // ━━━━━ Levels (Smart filtering) ━━━━━
  const { data: levels = [], isLoading: levelsLoading } = useQuery({
    queryKey: [
      "admin",
      "levels",
      filters.selectedSchoolYearId,
      filters.selectedCourseId,
      filters.selectedStrandId,
    ],
    queryFn: async () => {
      if (!filters.selectedSchoolYearId) return [];

      if (filters.selectedCourseId !== "all") {
        return levelApi.getByCourse(
          filters.selectedSchoolYearId,
          filters.selectedCourseId
        );
      }

      if (filters.selectedStrandId !== "all") {
        return levelApi.getByStrand(
          filters.selectedSchoolYearId,
          filters.selectedStrandId
        );
      }

      return levelApi.getBySchoolYear(filters.selectedSchoolYearId);
    },
    enabled: !!filters.selectedSchoolYearId,
  });

  // ━━━━━ Courses ━━━━━
  const { data: courses = [] } = useQuery({
    queryKey: [
      "admin",
      "courses",
      filters.selectedSchoolYearId,
      filters.selectedProgramId,
    ],
    queryFn: () =>
      courseApi.getAll({
        schoolYearId: filters.selectedSchoolYearId!,
        programId: filters.selectedProgramId,
      }),
    enabled:
      filters.selectedProgramId !== "all" && !!filters.selectedSchoolYearId,
  });

  // ━━━━━ Strands ━━━━━
  const { data: strands = [] } = useQuery({
    queryKey: ["admin", "strands", filters.selectedProgramId],
    queryFn: () => strandApi.getAll({ program_id: filters.selectedProgramId }),
    enabled: filters.selectedProgramId !== "all",
  });

  // ━━━━━ Educators ━━━━━
  const { data: educators = [], isLoading: educatorsLoading } = useQuery({
    queryKey: ["admin", "educators", "all"],
    queryFn: () => educatorApi.getAll(),
    select: (data) => (Array.isArray(data) ? data : []),
  });

  // ━━━━━ Subjects ━━━━━
  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: [
      "admin",
      "subjects",
      filters.selectedSchoolYearId,
      filters.selectedProgramId,
      filters.filterLevelId,
      filters.selectedCourseId,
      filters.selectedStrandId,
      filters.activeTab,
    ],
    queryFn: () =>
      subjectApi.getAll({
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
      }),
    enabled: !!filters.selectedSchoolYearId,
  });

  return {
    schoolYears,
    syLoading,
    programs,
    programsLoading,
    levels,
    levelsLoading,
    courses,
    strands,
    educators,
    educatorsLoading,
    subjects,
    subjectsLoading,
  };
}