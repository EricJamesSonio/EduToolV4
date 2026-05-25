import { UseQueryResult, UseMutationResult, useQueryClient } from "@tanstack/react-query";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { adminGradingSchemeApi } from "@/api/admin/grading-scheme.api";
import type {
  CreateGradingSchemeDto,
  UpdateGradingSchemeDto,
} from "@/types/admin/grading-scheme.types";

// Get grading scheme by class
export const useGradingSchemeByClass = (classId: string): UseQueryResult<any, Error> => {
  return useAsyncQuery(
    queryKeys.admin.gradingSchemes.detail(classId),
    () => adminGradingSchemeApi.getByClass(classId),
    {
      enabled: !!classId,
    },
  );
};

// Create grading scheme
export const useCreateGradingScheme = (): UseMutationResult<any, Error, CreateGradingSchemeDto> => {
  const queryClient = useQueryClient();

  return useMutationWithInvalidation<any, Error, CreateGradingSchemeDto>(
    (data) => adminGradingSchemeApi.create(data),
    {
      invalidateKeys: [],
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.gradingSchemes.detail(data.classId),
        });
      },
    },
  );
};

// Update grading scheme
export const useUpdateGradingScheme = (): UseMutationResult<
  any,
  Error,
  { schemeId: string; data: UpdateGradingSchemeDto }
> => {
  const queryClient = useQueryClient();

  return useMutationWithInvalidation<any, Error, { schemeId: string; data: UpdateGradingSchemeDto }>(
    ({ schemeId, data }) => adminGradingSchemeApi.update(schemeId, data),
    {
      invalidateKeys: [],
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.gradingSchemes.detail(data.classId),
        });
      },
    },
  );
};

// Apply template to single class
export const useApplyTemplateToClass = (): UseMutationResult<
  any,
  Error,
  { classId: string; templateId: string; name?: string }
> => {
  const queryClient = useQueryClient();

  return useMutationWithInvalidation<any, Error, { classId: string; templateId: string; name?: string }>(
    (payload) => adminGradingSchemeApi.applyToClass(payload),
    {
      invalidateKeys: [],
      onSuccess: (data) => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.gradingSchemes.detail(data.classId),
        });
      },
    },
  );
};

// Apply template to program (bulk)
export const useApplyTemplateToProgram = (): UseMutationResult<
  void,
  Error,
  { programId: string; templateId: string; overwriteExisting?: boolean }
> => {
  const queryClient = useQueryClient();

  return useMutationWithInvalidation<void, Error, { programId: string; templateId: string; overwriteExisting?: boolean }>(
    (payload) => adminGradingSchemeApi.applyToProgram(payload),
    {
      invalidateKeys: [queryKeys.admin.gradingSchemes.list()],
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.gradingSchemes.all,
        });
      },
    },
  );
};