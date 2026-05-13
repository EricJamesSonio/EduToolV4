// ===== client/src/hooks/useGradingScales.ts =====

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gradingScaleApi } from '../api/grading-scale.api';
import type {
  CreateGradingScaleDto,
  UpdateGradingScaleDto,
  QueryGradingScaleDto,
} from '../types/grading-scale.types';

export const gradingScaleKeys = {
  all: ['grading-scales'] as const,
  lists: () => [...gradingScaleKeys.all, 'list'] as const,
  list: (filters: QueryGradingScaleDto) => [...gradingScaleKeys.lists(), filters] as const,
};

export const useGradingScales = (params?: QueryGradingScaleDto) => {
  return useQuery({
    queryKey: gradingScaleKeys.list(params ?? {}),
    queryFn: () => gradingScaleApi.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateGradingScale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGradingScaleDto) => gradingScaleApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradingScaleKeys.lists() });
    },
  });
};

export const useUpdateGradingScale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGradingScaleDto }) =>
      gradingScaleApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradingScaleKeys.lists() });
    },
  });
};

export const useDeleteGradingScale = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => gradingScaleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gradingScaleKeys.lists() });
    },
  });
};