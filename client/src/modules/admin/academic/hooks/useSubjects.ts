import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { subjectApi } from '../api/subject.api';
import type { CreateSubjectDto, UpdateSubjectDto } from '../api/subject.api';
import type { QuerySubjectParams } from '../types/subject.types';

export const subjectKeys = {
  all: ['subjects'] as const,
  lists: () => [...subjectKeys.all, 'list'] as const,
  list: (filters: QuerySubjectParams) => [...subjectKeys.lists(), filters] as const,
  detail: (id: string) => [...subjectKeys.all, 'detail', id] as const,
};

export const useSubjects = (params: QuerySubjectParams = {}) => {
  return useQuery({
    queryKey: subjectKeys.list(params),
    queryFn: () => subjectApi.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSubjectsByLevel = (levelId: string, schoolYearId: string) => {
  return useQuery({
    queryKey: subjectKeys.list({ levelId, schoolYearId }),
    queryFn: () => subjectApi.getAll({ levelId, schoolYearId }),
    enabled: !!(levelId && schoolYearId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useSubject = (id: string) => {
  return useQuery({
    queryKey: subjectKeys.detail(id),
    queryFn: () => subjectApi.getById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateSubjectDto) => subjectApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
    },
  });
};

export const useUpdateSubject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSubjectDto }) =>
      subjectApi.update(id, dto),
    onSuccess: (updated) => {
      queryClient.setQueryData(subjectKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: subjectKeys.lists() });
    },
  });
};