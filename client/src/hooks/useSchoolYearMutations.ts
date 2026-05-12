// School Year Mutations Hook
// React Query mutations for school year operations

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { schoolYearApi } from '../api/school-year.api';
import { schoolYearKeys } from './useSchoolYears';
import type { CreateSchoolYearDto } from '../types/school-year.types';

export const useCreateSchoolYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSchoolYearDto) =>
      schoolYearApi.createSchoolYear(data),
    onSuccess: (result) => {
      // Invalidate school years queries to refetch data
      queryClient.invalidateQueries({ queryKey: schoolYearKeys.allList() });

      // Show success message if there's a warning
      if (result.warning) {
        console.warn(result.warning);
      }
    },
    onError: (error) => {
      console.error('Failed to create school year:', error);
    },
  });
};

export const useUpdateSchoolYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSchoolYearDto> }) =>
      schoolYearApi.updateSchoolYear(id, data),
    onSuccess: (_, variables) => {
      // Invalidate specific school year query and list
      queryClient.invalidateQueries({ queryKey: schoolYearKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: schoolYearKeys.all });
    },
    onError: (error) => {
      console.error('Failed to update school year:', error);
    },
  });
};

export const useActivateSchoolYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      schoolYearApi.activateSchoolYear(id),
    onSuccess: () => {
      // Invalidate school years queries to refetch data
      queryClient.invalidateQueries({ queryKey: schoolYearKeys.all });
      queryClient.invalidateQueries({ queryKey: schoolYearKeys.active() });
    },
    onError: (error) => {
      console.error('Failed to activate school year:', error);
    },
  });
};

export const useEndSchoolYear = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      schoolYearApi.endSchoolYear(id),
    onSuccess: () => {
      // Invalidate school years queries to refetch data
      queryClient.invalidateQueries({ queryKey: schoolYearKeys.all });
      queryClient.invalidateQueries({ queryKey: schoolYearKeys.active() });
    },
    onError: (error) => {
      console.error('Failed to end school year:', error);
    },
  });
};
