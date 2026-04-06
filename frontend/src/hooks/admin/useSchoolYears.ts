// ===== File: frontend/src/hooks/admin/useSchoolYears.ts =====
import {
  useQuery, useMutation, useQueryClient,
  UseQueryResult, UseMutationResult,
} from "@tanstack/react-query";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { programApi }    from "@/api/admin/program.api";
import { sectionApi }    from "@/api/admin/section.api";
import { courseApi }     from "@/api/admin/course.api";
import type { SchoolYear } from "@/types/admin/school-year.types";

// ─── School Years ──────────────────────────────────────────────

export const useSchoolYears = (): UseQueryResult<SchoolYear[], unknown> => {
  return useQuery({
    queryKey: ["admin", "school-years"],
    queryFn:  schoolYearApi.getAll,
  });
};

export const useCreateSchoolYear = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: schoolYearApi.create,
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ["admin", "school-years"] }),
  });
};

export const useActivateSchoolYear = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: schoolYearApi.activate,
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ["admin", "school-years"] }),
  });
};

export const useEndSchoolYear = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: schoolYearApi.end,
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ["admin", "school-years"] }),
  });
};

// ─── Scoped by School Year ─────────────────────────────────────

export const usePrograms = (schoolYearId: string | null) => {
  return useQuery({
    queryKey: ["admin", "programs", schoolYearId],
    queryFn:  () => programApi.getAll(schoolYearId!),
    enabled:  !!schoolYearId,
  });
};

export const useSections = (schoolYearId: string | null, levelId?: string) => {
  return useQuery({
    queryKey: ["admin", "sections", schoolYearId, levelId],
    queryFn:  () => sectionApi.getAll(schoolYearId!, levelId),
    enabled:  !!schoolYearId,
  });
};

export const useCourses = (schoolYearId: string | null, programId?: string) => {
  return useQuery({
    queryKey: ["admin", "courses", schoolYearId, programId],
    queryFn:  () => courseApi.getAll({ schoolYearId: schoolYearId!, programId }),
    enabled:  !!schoolYearId,
  });
};