// frontend/src/hooks/admin/useCourses.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query";
import { courseApi } from "@/api/admin/course.api";
import type { Course } from "@/types/admin/course.types";
import type {
  CreateCourseRequest,
  UpdateCourseRequest,
  GetCoursesQuery,
} from "@/api/admin/course.api";

export const useCourses = (
  query?: GetCoursesQuery,
): UseQueryResult<Course[], unknown> => {
  return useQuery<Course[], unknown>({
    queryKey: ["courses", query],
    queryFn: () => courseApi.getAll(query),
  });
};

export const useCourse = (id: string): UseQueryResult<Course, unknown> => {
  return useQuery<Course, unknown>({
    queryKey: ["courses", id],
    queryFn: () => courseApi.getOne(id),
    enabled: !!id,
  });
};

export const useCreateCourse = (): UseMutationResult<
  Course,
  unknown,
  CreateCourseRequest
> => {
  const queryClient = useQueryClient();
  return useMutation<Course, unknown, CreateCourseRequest>({
    mutationFn: courseApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
};

export const useUpdateCourse = (): UseMutationResult<
  Course,
  unknown,
  { id: string; data: UpdateCourseRequest }
> => {
  const queryClient = useQueryClient();
  return useMutation<Course, unknown, { id: string; data: UpdateCourseRequest }>({
    mutationFn: ({ id, data }) => courseApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
};

export const useDeleteCourse = (): UseMutationResult<void, unknown, string> => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: courseApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
};