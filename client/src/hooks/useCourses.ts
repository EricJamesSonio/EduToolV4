import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../api/course.api';
import type { CreateCourseDto, UpdateCourseDto } from '../types/course.types';

export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (filters: Record<string, string | undefined>) => [...courseKeys.lists(), filters] as const,
};

export const useCoursesByProgram = (schoolYearId: string, programId: string) => {
  return useQuery({
    queryKey: courseKeys.list({ schoolYearId, programId }),
    queryFn: () => courseApi.getCoursesByProgram(schoolYearId, programId),
    enabled: !!(schoolYearId && programId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCourseDto) => courseApi.createCourse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCourseDto }) =>
      courseApi.updateCourse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => courseApi.deleteCourse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
  });
};
