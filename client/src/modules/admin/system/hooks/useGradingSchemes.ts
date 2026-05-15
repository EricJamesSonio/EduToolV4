import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gradingSchemeApi } from '../api/grading-scheme.api';
import type { ApplyTemplateToProgramDto } from '../api/grading-scheme.api';
import { gradingSchemeTemplateKeys } from './useGradingSchemeTemplates';

export const useApplyTemplateToProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: ApplyTemplateToProgramDto) =>
      gradingSchemeApi.applyToProgram(dto),
    onSuccess: () => {
      // Invalidate templates in case assignment state is derived from them
      queryClient.invalidateQueries({
        queryKey: gradingSchemeTemplateKeys.lists(),
      });
    },
  });
};