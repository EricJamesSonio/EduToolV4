import {
  useQuery, useMutation, useQueryClient,
  UseQueryResult, UseMutationResult,
} from "@tanstack/react-query";
import { schoolYearApi } from "@/api/admin/school-year.api";
import type { SchoolYear } from "@/types/admin/school-year.types";

export const useSchoolYears = (): UseQueryResult<SchoolYear[], unknown> => {
  return useQuery({
    queryKey: ["schoolYears"],
    queryFn:  schoolYearApi.getAll,
  });
};

/** Returns the active school year id, falling back to the first one. */
export function useActiveSchoolYearId(): string | null {
  const { data: schoolYears = [] } = useSchoolYears();
  if (schoolYears.length === 0) return null;
  return (schoolYears.find((sy) => sy.status === "active") ?? schoolYears[0]).id;
}

export const useCreateSchoolYear = (): UseMutationResult<SchoolYear, unknown, { name: string }, unknown> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: schoolYearApi.create,
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ["schoolYears"] }); },
  });
};

export const useUpdateSchoolYear = (): UseMutationResult<
  SchoolYear,
  unknown,
  { id: string; data: { name: string } },
  unknown
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => schoolYearApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schoolYears"] });
    },
  });
};

export const useActivateSchoolYear = (): UseMutationResult<SchoolYear, unknown, string, unknown> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: schoolYearApi.activate,
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ["schoolYears"] }); },
  });
};

export const useEndSchoolYear = (): UseMutationResult<SchoolYear, unknown, string, unknown> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: schoolYearApi.end,
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ["schoolYears"] }); },
  });
};