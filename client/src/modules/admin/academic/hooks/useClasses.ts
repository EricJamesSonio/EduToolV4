import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { classApi } from '../api/class.api';
import type { ClassQueryParams, CreateClassDto, UpdateClassDto } from '../api/class.api';

export const classKeys = {
  all: ['classes'] as const,
  lists: () => [...classKeys.all, 'list'] as const,
  list: (filters: ClassQueryParams) => [...classKeys.lists(), filters] as const,
  bySection: (schoolYearId: string, sectionId: string) =>
    [...classKeys.lists(), { schoolYearId, sectionId }] as const,
  detail: (id: string) => [...classKeys.all, 'detail', id] as const,
};

export const useClasses = (params: ClassQueryParams = {}) => {
  return useQuery({
    queryKey: classKeys.list(params),
    queryFn: () => classApi.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useClassesBySection = (schoolYearId: string, sectionId: string) => {
  return useQuery({
    queryKey: classKeys.bySection(schoolYearId, sectionId),
    queryFn: () => classApi.getAll({ schoolYearId, sectionId }),
    enabled: !!(schoolYearId && sectionId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateClassDto) => classApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
    },
  });
};

export const useUpdateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateClassDto }) =>
      classApi.update(id, dto),
    onSuccess: (updated) => {
      queryClient.setQueryData(classKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
    },
  });
};

export const useDeleteClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => classApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: classKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
    },
  });
};