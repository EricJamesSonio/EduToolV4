import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { educatorGradingSchemeApi } from '@/api/educator/grading-scheme.api';
import type {
  CreateGradingSchemeTemplateDto,
} from '@/types/admin/grading-scheme-template.types';

export const useEducatorTemplateLibrary = (programType?: string) => {
  return useAsyncQuery(
    queryKeys.educator.gradingSchemeTemplates.list(programType),
    () => educatorGradingSchemeApi.getTemplates(programType),
  );
};

export const useEducatorTemplate = (templateId: string) => {
  return useAsyncQuery(
    queryKeys.educator.gradingSchemeTemplates.detail(templateId),
    () => educatorGradingSchemeApi.getTemplate(templateId),
    { enabled: !!templateId },
  );
};

export const useCreateTemplate = () => {
  return useMutationWithInvalidation(
    (data: CreateGradingSchemeTemplateDto) =>
      educatorGradingSchemeApi.createTemplate(data),
    {
      invalidateKeys: [
        queryKeys.educator.gradingSchemeTemplates.all,
      ],
    },
  );
};

export const useUpdateTemplate = () => {
  return useMutationWithInvalidation(
    ({ templateId, data }: { templateId: string; data: Partial<CreateGradingSchemeTemplateDto> }) =>
      educatorGradingSchemeApi.updateTemplate(templateId, data),
    {
      invalidateKeys: [
        queryKeys.educator.gradingSchemeTemplates.all,
      ],
    },
  );
};

export const useDeleteTemplate = () => {
  return useMutationWithInvalidation(
    (templateId: string) =>
      educatorGradingSchemeApi.deleteTemplate(templateId),
    {
      invalidateKeys: [
        queryKeys.educator.gradingSchemeTemplates.all,
      ],
    },
  );
};
