import { UseQueryResult, UseMutationResult, useQueryClient } from "@tanstack/react-query";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { courseApi } from "@/api/admin/course.api";
import type { Course } from "@/types/admin/course.types";
import type {
  CreateCourseRequest,
  UpdateCourseRequest,
  GetCoursesQuery,
} from "@/api/admin/course.api";
import { toast } from "sonner";

// Fetch multiple courses
export const useCourses = (query: GetCoursesQuery): UseQueryResult<Course[], Error> => {
  return useAsyncQuery<Course[]>(
    [...queryKeys.admin.courses.list(query)] as const,
    () => courseApi.getAll(query),
    {
      staleTime: 1000 * 60,
    },
  );
};

// Fetch single course
export const useCourse = (id: string): UseQueryResult<Course, Error> => {
  return useAsyncQuery<Course>(
    queryKeys.admin.courses.detail(id),
    () => courseApi.getOne(id),
    {
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
    },
  );
};

// Create course
export const useCreateCourse = (): UseMutationResult<Course, Error, CreateCourseRequest> => {
  const queryClient = useQueryClient();

  return useMutationWithInvalidation<Course, Error, CreateCourseRequest>(
    (data) => courseApi.create(data),
    {
      invalidateKeys: [queryKeys.admin.courses.list()],
      onSuccess: (newCourse) => {
        queryClient.setQueryData(queryKeys.admin.courses.detail(newCourse.id), newCourse);
        toast.success("Course created successfully");
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to create course");
      },
    },
  );
};

// Update course
export const useUpdateCourse = (): UseMutationResult<
  Course,
  Error,
  { id: string; data: UpdateCourseRequest }
> => {
  const queryClient = useQueryClient();

  return useMutationWithInvalidation<Course, Error, { id: string; data: UpdateCourseRequest }>(
    ({ id, data }) => courseApi.update(id, data),
    {
      invalidateKeys: [queryKeys.admin.courses.list()],
      onMutate: async ({ id, data }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.admin.courses.detail(id) });

        const previousCourse = queryClient.getQueryData(queryKeys.admin.courses.detail(id));

        queryClient.setQueryData(queryKeys.admin.courses.detail(id), (old: Course) =>
          old ? { ...old, ...data } : null
        );

        return { previousCourse };
      },
      onError: (err, variables, context: any) => {
        if (context?.previousCourse) {
          queryClient.setQueryData(queryKeys.admin.courses.detail(variables.id), context.previousCourse);
        }
        toast.error("Failed to update course");
      },
      onSuccess: () => {
        toast.success("Course updated successfully");
      },
    },
  );
};

// Delete course
export const useDeleteCourse = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutationWithInvalidation<void, Error, string>(
    (id) => courseApi.remove(id),
    {
      invalidateKeys: [queryKeys.admin.courses.list()],
      onMutate: async (id) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.admin.courses.detail(id) });

        const previousCourse = queryClient.getQueryData(queryKeys.admin.courses.detail(id));

        queryClient.removeQueries({ queryKey: queryKeys.admin.courses.detail(id) });

        return { previousCourse };
      },
      onError: (err, variables, context: any) => {
        if (context?.previousCourse) {
          queryClient.setQueryData(queryKeys.admin.courses.detail(variables), context.previousCourse);
        }
        toast.error("Failed to delete course");
      },
      onSuccess: () => {
        toast.success("Course deleted successfully");
      },
    },
  );
};