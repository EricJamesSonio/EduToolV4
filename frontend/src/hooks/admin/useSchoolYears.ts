import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { schoolYearApi } from "@/api/admin/school-year.api"; // API functions
import type { SchoolYear } from "@/types/admin/school-year.types"; // Type only

// Hook for fetching all school years
export const useSchoolYears = (): UseQueryResult<SchoolYear[], unknown> => {
  return useQuery({
    queryKey: ["schoolYears"],
    queryFn: schoolYearApi.getAll,
  });
};

// Hook for creating a school year
export const useCreateSchoolYear = (): UseMutationResult<SchoolYear, unknown, { name: string }, unknown> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: schoolYearApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schoolYears"] });
    },
  });
};

// Hook for updating a school year
export const useUpdateSchoolYear = (): UseMutationResult<
  SchoolYear,
  unknown,
  { id: string; data: { name: string } },
  unknown
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string } }) =>
      schoolYearApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schoolYears"] });
    },
  });
};

// Hook for activating a school year
export const useActivateSchoolYear = (): UseMutationResult<SchoolYear, unknown, string, unknown> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: schoolYearApi.activate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schoolYears"] });
    },
  });
};

// Hook for ending a school year
export const useEndSchoolYear = (): UseMutationResult<SchoolYear, unknown, string, unknown> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: schoolYearApi.end,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schoolYears"] });
    },
  });
};