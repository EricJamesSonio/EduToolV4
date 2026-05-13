import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { studentApi } from '../api/student.api';
import type {
  CreateStudentDto,
  StudentQueryParams,
  UpdateStudentDto,
  UpdateStudentStatusDto,
} from '../types/student.types';

export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  list: (filters: StudentQueryParams) => [...studentKeys.lists(), filters] as const,
  detail: (id: string) => [...studentKeys.all, 'detail', id] as const,
};

export const useStudents = (params: StudentQueryParams = {}) => {
  return useQuery({
    queryKey: studentKeys.list(params),
    queryFn: () => studentApi.getAll(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useStudent = (id: string) => {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentApi.getById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
};

export const useCreateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateStudentDto) => studentApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
};

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudentDto }) =>
      studentApi.update(id, data),
    onSuccess: (student) => {
      queryClient.setQueryData(studentKeys.detail(student.id), student);
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
};

export const useUpdateStudentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudentStatusDto }) =>
      studentApi.updateStatus(id, data),
    onSuccess: (student) => {
      queryClient.setQueryData(studentKeys.detail(student.id), student);
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
  });
};

export const useResetStudentPassword = () => {
  return useMutation({
    mutationFn: (id: string) => studentApi.resetPassword(id),
  });
};
