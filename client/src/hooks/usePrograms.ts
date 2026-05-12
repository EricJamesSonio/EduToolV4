// Programs Hook
// React Query hook for fetching and managing programs

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { programApi } from '../api/program.api';
import type { CreateProgramDto, UpdateProgramDto } from '../types/program.types';

// Query keys for cache management
export const programKeys = {
  all: ['programs'] as const,
  allList: (schoolYearId: string) => [...programKeys.all, 'list', schoolYearId] as const,
  detail: (id: string) => [...programKeys.all, 'detail', id] as const,
};

// Hook for programs by school year
export const useProgramsBySchoolYear = (schoolYearId: string, includeAssignments = false) => {
  return useQuery({
    queryKey: programKeys.allList(schoolYearId),
    queryFn: () => programApi.getProgramsBySchoolYear(schoolYearId, includeAssignments),
    enabled: !!schoolYearId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

// Hook for single program
export const useProgram = (id: string) => {
  return useQuery({
    queryKey: programKeys.detail(id),
    queryFn: () => programApi.getProgramById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
};

// Hook for creating programs
export const useCreateProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProgramDto) => programApi.createProgram(data),
    onSuccess: (newProgram) => {
      // Invalidate the programs list for the school year
      queryClient.invalidateQueries({
        queryKey: programKeys.allList(newProgram.schoolYearId),
      });
    },
  });
};

// Hook for updating programs
export const useUpdateProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProgramDto }) =>
      programApi.updateProgram(id, data),
    onSuccess: (updatedProgram) => {
      // Update the specific program in cache
      queryClient.setQueryData(
        programKeys.detail(updatedProgram.id),
        updatedProgram
      );

      // Invalidate the programs list to refetch
      queryClient.invalidateQueries({
        queryKey: programKeys.allList(updatedProgram.schoolYearId),
      });
    },
  });
};

// Hook for deleting programs
export const useDeleteProgram = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => programApi.deleteProgram(id),
    onSuccess: (_, deletedId) => {
      // Remove the specific program from cache
      queryClient.removeQueries({
        queryKey: programKeys.detail(deletedId),
      });

      // Invalidate all programs lists to trigger refetch
      queryClient.invalidateQueries({
        queryKey: programKeys.all,
      });
    },
  });
};
