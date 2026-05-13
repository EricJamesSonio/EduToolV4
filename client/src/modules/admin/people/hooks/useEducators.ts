import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { educatorApi } from '../api/educator.api';
import type {
  CreateEducatorDto,
  EducatorQueryParams,
  UpdateEducatorDto,
} from '../types/educator.types';

export const educatorKeys = {
  all: ['educators'] as const,
  lists: () => [...educatorKeys.all, 'list'] as const,
  list: (filters: EducatorQueryParams) => [...educatorKeys.lists(), filters] as const,
  detail: (id: string) => [...educatorKeys.all, 'detail', id] as const,
};

export const useEducators = (params: EducatorQueryParams = {}) => {
  return useQuery({
    queryKey: educatorKeys.list(params),
    queryFn: () => educatorApi.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useEducator = (id: string) => {
  return useQuery({
    queryKey: educatorKeys.detail(id),
    queryFn: () => educatorApi.getById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
};

export const useCreateEducator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEducatorDto) => educatorApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: educatorKeys.lists() });
    },
  });
};

export const useUpdateEducator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEducatorDto }) =>
      educatorApi.update(id, data),
    onSuccess: (educator) => {
      queryClient.setQueryData(educatorKeys.detail(educator.id), educator);
      queryClient.invalidateQueries({ queryKey: educatorKeys.lists() });
    },
  });
};

export const useDeleteEducator = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => educatorApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: educatorKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: educatorKeys.lists() });
    },
  });
};

export const useResetEducatorPassword = () => {
  return useMutation({
    mutationFn: (id: string) => educatorApi.resetPassword(id),
  });
};
