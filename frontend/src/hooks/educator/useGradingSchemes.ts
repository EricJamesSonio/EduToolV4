import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { educatorGradingSchemeApi } from '@/api/educator/grading-scheme.api';
import type {
  CreateGradingSchemeDto,
  UpdateGradingSchemeDto,
} from '@/types/admin/grading-scheme.types';

export const useClassGradingScheme = (classId: string) => {
  return useAsyncQuery(
    queryKeys.educator.gradingSchemes.detail(classId),
    () => educatorGradingSchemeApi.getForClass(classId),
    { enabled: !!classId },
  );
};

export const useCreateGradingScheme = () => {
  return useMutationWithInvalidation(
    (data: CreateGradingSchemeDto) => educatorGradingSchemeApi.create(data),
    {
      invalidateKeys: [
        queryKeys.educator.gradingSchemes.all,
      ],
    },
  );
};

export const useUpdateGradingScheme = () => {
  return useMutationWithInvalidation(
    ({ id, data }: { id: string; data: UpdateGradingSchemeDto }) =>
      educatorGradingSchemeApi.update(id, data),
    {
      invalidateKeys: [
        queryKeys.educator.gradingSchemes.all,
      ],
    },
  );
};

export const useApplyTemplateToClass = () => {
  return useMutationWithInvalidation(
    (data: { classId: string; templateId: string; name?: string }) =>
      educatorGradingSchemeApi.applyTemplateToClass(data),
    {
      invalidateKeys: [
        queryKeys.educator.gradingSchemes.all,
      ],
    },
  );
};

export const useApplyTemplateToProgram = () => {
  return useMutationWithInvalidation(
    (data: { programId: string; templateId: string }) =>
      educatorGradingSchemeApi.applyTemplateToProgram(data),
    {
      invalidateKeys: [
        queryKeys.educator.gradingSchemes.all,
      ],
    },
  );
};
