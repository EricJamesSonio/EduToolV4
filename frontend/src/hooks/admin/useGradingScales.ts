import { useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query";
import { gradingScaleApi } from "@/api/admin/grading-scale.api";
import type { GradingScale } from "@/types/admin/grading-scale.types";
import type { CreateGradingScaleRequest } from "@/api/admin/grading-scale.api"; // make sure you export this

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