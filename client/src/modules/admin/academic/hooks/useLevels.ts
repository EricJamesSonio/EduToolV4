import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { levelApi } from '../api/level.api';
import type { CreateLevelDto, UpdateLevelDto } from '../types/level.types';
import { handleApiError } from '@/api/apiClient';

// Query keys
export const levelKeys = {
  all: ['levels'] as const,
  lists: () => [...levelKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...levelKeys.lists(), filters] as const,
  details: () => [...levelKeys.all, 'detail'] as const,
  detail: (id: string) => [...levelKeys.details(), id] as const,
  defaults: () => [...levelKeys.all, 'defaults'] as const,
};

// Hooks for getting levels
export const useLevels = (params?: { schoolYearId?: string }) => {
  return useQuery({
    queryKey: levelKeys.list(params || {}),
    queryFn: () => levelApi.getAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useLevelsBySchoolYear = (schoolYearId: string) => {
  return useQuery({
    queryKey: levelKeys.list({ schoolYearId }),
    queryFn: () => levelApi.getBySchoolYear(schoolYearId),
    enabled: !!schoolYearId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useLevelsByCourse = (schoolYearId: string, courseId: string) => {
  return useQuery({
    queryKey: levelKeys.list({ schoolYearId, courseId }),
    queryFn: () => levelApi.getByCourse(schoolYearId, courseId),
    enabled: !!(schoolYearId && courseId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useLevelsByStrand = (schoolYearId: string, strandId: string) => {
  return useQuery({
    queryKey: levelKeys.list({ schoolYearId, strandId }),
    queryFn: () => levelApi.getByStrand(schoolYearId, strandId),
    enabled: !!(schoolYearId && strandId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useDefaultLevels = () => {
  return useQuery({
    queryKey: levelKeys.defaults(),
    queryFn: () => levelApi.getDefaults(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hooks for mutations
export const useCreateLevel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLevelDto) => levelApi.create(data),
    onSuccess: () => {
      // Invalidate all level queries to refetch
      queryClient.invalidateQueries({ queryKey: levelKeys.lists() });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      console.error('Failed to create level:', apiError);
      throw apiError;
    },
  });
};

export const useUpdateLevel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLevelDto }) =>
      levelApi.updateOne(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific level detail and all lists
      queryClient.invalidateQueries({ queryKey: levelKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: levelKeys.lists() });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      console.error('Failed to update level:', apiError);
      throw apiError;
    },
  });
};

export const useDeleteLevel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => levelApi.deleteOne(id),
    onSuccess: () => {
      // Invalidate all level queries to refetch
      queryClient.invalidateQueries({ queryKey: levelKeys.lists() });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      console.error('Failed to delete level:', apiError);
      throw apiError;
    },
  });
};

export const useBulkGenerateLevels = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      programId: string;
      schoolYearId: string;
      count: number;
    }) => levelApi.bulkGenerate(data),
    onSuccess: () => {
      // Invalidate all level queries to refetch
      queryClient.invalidateQueries({ queryKey: levelKeys.lists() });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      console.error('Failed to bulk generate levels:', apiError);
      throw apiError;
    },
  });
};

export const useUpdateDefaultLevels = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      levels: Array<{
        id?: string;
        programId: string;
        name: string;
      }>;
    }) => levelApi.updateDefaults(data),
    onSuccess: () => {
      // Invalidate default levels query
      queryClient.invalidateQueries({ queryKey: levelKeys.defaults() });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      console.error('Failed to update default levels:', apiError);
      throw apiError;
    },
  });
};

export const useAddNextLevel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ programId, schoolYearId }: { programId: string; schoolYearId: string }) =>
      levelApi.addNextLevel(programId, schoolYearId),
    onSuccess: () => {
      // Invalidate all level queries to refetch
      queryClient.invalidateQueries({ queryKey: levelKeys.lists() });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      console.error('Failed to add next level:', apiError);
      throw apiError;
    },
  });
};

export const useRemoveLevel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (levelId: string) => levelApi.removeLevel(levelId),
    onSuccess: () => {
      // Invalidate all level queries to refetch
      queryClient.invalidateQueries({ queryKey: levelKeys.lists() });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      console.error('Failed to remove level:', apiError);
      throw apiError;
    },
  });
};
