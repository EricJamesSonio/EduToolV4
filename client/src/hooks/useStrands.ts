import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { strandApi } from '../api/strand.api';
import type { CreateStrandDto, UpdateStrandDto } from '../types/strand.types';

export const strandKeys = {
  all: ['strands'] as const,
  lists: () => [...strandKeys.all, 'list'] as const,
  list: (filters: Record<string, string | undefined>) => [...strandKeys.lists(), filters] as const,
};

export const useStrandsByProgram = (schoolYearId: string, programId: string) => {
  return useQuery({
    queryKey: strandKeys.list({ schoolYearId, programId }),
    queryFn: () => strandApi.getStrandsByProgram(schoolYearId, programId),
    enabled: !!(schoolYearId && programId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateStrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStrandDto) => strandApi.createStrand(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strandKeys.lists() });
    },
  });
};

export const useUpdateStrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStrandDto }) =>
      strandApi.updateStrand(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strandKeys.lists() });
    },
  });
};

export const useDeleteStrand = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => strandApi.deleteStrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: strandKeys.lists() });
    },
  });
};
