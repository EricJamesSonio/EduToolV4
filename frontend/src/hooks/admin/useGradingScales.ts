import { UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { gradingScaleApi } from "@/api/admin/grading-scale.api";
import type { GradingScale, GradingScaleAssignment } from "@/types/admin/grading-scale.types";
import type {
  CreateGradingScaleRequest,
  UpdateGradingScaleRequest,
  GetGradingScalesQuery,
} from "@/api/admin/grading-scale.api";

export const useGradingScales = (
  query?: GetGradingScalesQuery,
): UseQueryResult<GradingScale[], Error> => {
  return useAsyncQuery<GradingScale[]>(
    query ? [...queryKeys.admin.gradingScales.list(query)] as const : queryKeys.admin.gradingScales.list(),
    () => gradingScaleApi.getAll(query),
  );
};

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

export const useGradingScaleAssignments = (
  schoolYearId: string | null,
): UseQueryResult<GradingScaleAssignment[], Error> => {
  return useAsyncQuery<GradingScaleAssignment[]>(
    ["admin", "gradingScales", "assignments", schoolYearId] as const,
    () => gradingScaleApi.getAssignments(schoolYearId!),
    { enabled: !!schoolYearId },
  );
};
