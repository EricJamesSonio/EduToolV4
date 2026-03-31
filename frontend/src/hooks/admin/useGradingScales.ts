// frontend/src/hooks/admin/useGradingScales.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationResult,
  UseQueryResult,
} from "@tanstack/react-query";
import { gradingScaleApi } from "@/api/admin/grading-scale.api";
import type { GradingScale } from "@/types/admin/grading-scale.types";
import type {
  CreateGradingScaleRequest,
  UpdateGradingScaleRequest,
  GetGradingScalesQuery,
} from "@/api/admin/grading-scale.api";

export const useGradingScales = (
  query?: GetGradingScalesQuery,
): UseQueryResult<GradingScale[], unknown> => {
  return useQuery<GradingScale[], unknown>({
    queryKey: ["gradingScales", query],
    queryFn: () => gradingScaleApi.getAll(query),
  });
};

export const useCreateGradingScale = (): UseMutationResult<
  GradingScale,
  unknown,
  CreateGradingScaleRequest
> => {
  const queryClient = useQueryClient();

  return useMutation<GradingScale, unknown, CreateGradingScaleRequest>({
    mutationFn: gradingScaleApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingScales"] });
    },
  });
};

export const useUpdateGradingScale = (): UseMutationResult<
  GradingScale,
  unknown,
  { id: string; data: UpdateGradingScaleRequest }
> => {
  const queryClient = useQueryClient();

  return useMutation<
    GradingScale,
    unknown,
    { id: string; data: UpdateGradingScaleRequest }
  >({
    mutationFn: ({ id, data }) => gradingScaleApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradingScales"] });
    },
  });
};