import { UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { gradingScaleApi } from "@/api/admin/grading-scale.api";
import type { GradingScale } from "@/types/admin/grading-scale.types";
import type {
  CreateGradingScaleRequest,
  UpdateGradingScaleRequest,
  GetGradingScalesQuery,
} from "@/api/admin/grading-scale.api";

// Get grading scales with optional filters
export const useGradingScales = (
  query?: GetGradingScalesQuery,
): UseQueryResult<GradingScale[], Error> => {
  return useAsyncQuery<GradingScale[]>(
    query ? [...queryKeys.admin.gradingScales.list(query)] as const : queryKeys.admin.gradingScales.list(),
    () => gradingScaleApi.getAll(query),
  );
};

// Create grading scale (includes programId in request)
export const useCreateGradingScale = (): UseMutationResult<
  GradingScale,
  Error,
  CreateGradingScaleRequest
> => {
  return useMutationWithInvalidation<GradingScale, Error, CreateGradingScaleRequest>(
    (data) => gradingScaleApi.create(data),
    {
      invalidateKeys: [queryKeys.admin.gradingScales.list()],
    },
  );
};

// Update grading scale
export const useUpdateGradingScale = (): UseMutationResult<
  GradingScale,
  Error,
  { id: string; data: UpdateGradingScaleRequest }
> => {
  return useMutationWithInvalidation<GradingScale, Error, { id: string; data: UpdateGradingScaleRequest }>(
    ({ id, data }) => gradingScaleApi.update(id, data),
    {
      invalidateKeys: [queryKeys.admin.gradingScales.list()],
    },
  );
};