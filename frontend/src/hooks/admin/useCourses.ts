import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
  type MutationFunctionContext,
} from "@tanstack/react-query";
import { courseApi } from "@/api/admin/course.api";
import type { Course } from "@/types/admin/course.types";
import type {
  CreateCourseRequest,
  UpdateCourseRequest,
  GetCoursesQuery,
} from "@/api/admin/course.api";
import { courseKeys } from "@/hooks/queryKeys";
import { toast } from "sonner";

// Hook to fetch multiple courses
export const useCourses = (
  query: GetCoursesQuery, // ✅ required
): UseQueryResult<Course[], unknown> => {
  return useQuery<Course[], unknown>({
    queryKey: courseKeys.list(query),
    queryFn: () => courseApi.getAll(query),
    staleTime: 1000 * 60, // 1 minute for course lists
  });
};

// Hook to fetch a single course
export const useCourse = (id: string): UseQueryResult<Course, unknown> => {
  return useQuery<Course, unknown>({
    queryKey: courseKeys.detail(id),
    queryFn: () => courseApi.getOne(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes for individual course data
  });
};

// Hook to create a course
export const useCreateCourse = (): UseMutationResult<
  Course,
  unknown,
  CreateCourseRequest
> => {
  const queryClient = useQueryClient();
  return useMutation<Course, unknown, CreateCourseRequest>({
    mutationFn: courseApi.create,
    onSuccess: (newCourse) => {
      queryClient.setQueryData(courseKeys.detail(newCourse.id), newCourse);
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
      toast.success("Course created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create course");
    },
  });
};

// Hook to update a course
export const useUpdateCourse = (): UseMutationResult<
  Course,
  unknown,
  { id: string; data: UpdateCourseRequest }
> => {
  const queryClient = useQueryClient();
  return useMutation<Course, unknown, { id: string; data: UpdateCourseRequest }>({
    mutationFn: ({ id, data }) => courseApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: courseKeys.detail(id) });

      const previousCourse = queryClient.getQueryData(courseKeys.detail(id));

      queryClient.setQueryData(courseKeys.detail(id), (old: Course) =>
        old ? { ...old, ...data } : null
      );

      return { previousCourse };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousCourse) {
        queryClient.setQueryData(courseKeys.detail(variables.id), context.previousCourse);
      }
      toast.error("Failed to update course");
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
    onSuccess: () => {
      toast.success("Course updated successfully");
    },
  });
};

// Hook to delete a course
export const useDeleteCourse = (): UseMutationResult<void, unknown, string> => {
  const queryClient = useQueryClient();
  return useMutation<void, unknown, string>({
    mutationFn: courseApi.remove,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: courseKeys.detail(id) });

      const previousCourse = queryClient.getQueryData(courseKeys.detail(id));

      queryClient.removeQueries({ queryKey: courseKeys.detail(id) });

      return { previousCourse };
    },
    onError: (err, variables, context: any) => {
      if (context?.previousCourse) {
        queryClient.setQueryData(courseKeys.detail(variables), context.previousCourse);
      }
      toast.error("Failed to delete course");
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
    },
    onSuccess: () => {
      toast.success("Course deleted successfully");
    },
  });
};