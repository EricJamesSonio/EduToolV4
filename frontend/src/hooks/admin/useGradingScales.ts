import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { gradingScaleApi } from "@/api/admin/grading-scale.api";
import type { GradingScale } from "@/types/admin/grading-scale.types";
import type { GetGradingScalesQuery } from "@/api/admin/grading-scale.api";

// Hook for fetching grading scales
export const useGradingScales = (query?: GetGradingScalesQuery): UseQueryResult<GradingScale[], unknown> => {
  return useQuery<GradingScale[]>({
    queryKey: ["gradingScales", query],
    queryFn: () => gradingScaleApi.getAll(query),
  });
};

// Hook for creating a new grading scale
export const useCreateGradingScale = (): UseMutationResult<GradingScale, unknown, Partial<GradingScale>> => {
  const queryClient = useQueryClient();

  return useMutation<GradingScale, unknown, Partial<GradingScale>>({
    mutationFn: gradingScaleApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingScales"] });
    },
  });
};

// Hook for updating an existing grading scale
export const useUpdateGradingScale = (): UseMutationResult<
  GradingScale, 
  unknown, 
  { id: string; data: Partial<GradingScale> }
> => {
  const queryClient = useQueryClient();

  return useMutation<GradingScale, unknown, { id: string; data: Partial<GradingScale> }>({
    mutationFn: ({ id, data }) => gradingScaleApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingScales"] });
    },
  });
};