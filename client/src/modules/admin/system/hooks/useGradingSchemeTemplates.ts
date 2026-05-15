// useGradingSchemeTemplates
// React Query hooks for grading scheme template CRUD

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gradingSchemeTemplateApi } from '../api/grading-scheme-template.api';
import type {
  CreateGradingSchemeTemplateDto,
  UpdateGradingSchemeTemplateDto,
} from '../types/grading-scheme.types';

export const gradingSchemeTemplateKeys = {
  all: ['grading-scheme-templates'] as const,
  lists: () => [...gradingSchemeTemplateKeys.all, 'list'] as const,
  list: (programType?: string) =>
    [...gradingSchemeTemplateKeys.lists(), { programType }] as const,
  detail: (id: string) =>
    [...gradingSchemeTemplateKeys.all, 'detail', id] as const,
};

export const useGradingSchemeTemplates = (programType?: string) => {
  return useQuery({
    queryKey: gradingSchemeTemplateKeys.list(programType),
    queryFn: () => gradingSchemeTemplateApi.getAll(programType),
    staleTime: 5 * 60 * 1000,
  });
};

// Fetches all templates with no filter — used for assignment matching
export const useAllGradingSchemeTemplates = () => {
  return useQuery({
    queryKey: gradingSchemeTemplateKeys.list(undefined),
    queryFn: () => gradingSchemeTemplateApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateGradingSchemeTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGradingSchemeTemplateDto) =>
      gradingSchemeTemplateApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradingSchemeTemplateKeys.lists() });
    },
  });
};

export const useUpdateGradingSchemeTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGradingSchemeTemplateDto }) =>
      gradingSchemeTemplateApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradingSchemeTemplateKeys.lists() });
    },
  });
};

export const useDeleteGradingSchemeTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => gradingSchemeTemplateApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradingSchemeTemplateKeys.lists() });
    },
  });
};