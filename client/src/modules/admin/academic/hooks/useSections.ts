// ===== File: client\src\modules\admin\academic\hooks\useSections.ts =====
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sectionApi, CreateSectionDto, UpdateSectionDto } from '../api/section.api';
import { handleApiError } from '@/api/apiClient';

export const sectionKeys = {
  all: ['sections'] as const,
  lists: () => [...sectionKeys.all, 'list'] as const,
  byLevel: (schoolYearId: string, levelId: string) =>
    [...sectionKeys.lists(), { schoolYearId, levelId }] as const,
};

export const useSectionsByLevel = (schoolYearId: string, levelId: string) => {
  return useQuery({
    queryKey: sectionKeys.byLevel(schoolYearId, levelId),
    queryFn: () => sectionApi.getByLevel(schoolYearId, levelId),
    enabled: !!(schoolYearId && levelId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSectionDto) => sectionApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.lists() });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      console.error('Failed to create section:', apiError);
      throw apiError;
    },
  });
};

export const useUpdateSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSectionDto }) =>
      sectionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.lists() });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      console.error('Failed to update section:', apiError);
      throw apiError;
    },
  });
};

export const useRemoveSection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sectionApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sectionKeys.lists() });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      console.error('Failed to remove section:', apiError);
      throw apiError;
    },
  });
};