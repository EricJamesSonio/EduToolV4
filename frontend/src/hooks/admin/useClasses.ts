import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { classApi } from "@/api/admin/class.api";
import type {
  GetClassesQuery,
  CreateClassRequest,
  UpdateClassRequest,
  EnrollmentResponse,
  EnrollOverflowResponse,
} from "@/api/admin/class.api";
import type { Class } from "@/types/admin/class.types";
import { classKeys, enrollmentKeys } from "@/hooks/queryKeys";
import { createStandardMutationOptions, showSuccessToast, showErrorToast, showWarningToast } from "@/lib/error-handling";
import { QUERY_CONFIGS } from "@/lib/query-client";

// Fetch all classes
export const useClasses = (query?: GetClassesQuery): UseQueryResult<Class[], Error> => {
  return useQuery({
    queryKey: classKeys.list(query),
    queryFn: () => classApi.getAll(query),
    ...QUERY_CONFIGS.list,
  });
};

// Fetch single class by ID
export const useClass = (id: string): UseQueryResult<Class, Error> => {
  return useQuery({
    queryKey: classKeys.detail(id),
    queryFn: () => classApi.getOne(id),
    enabled: !!id,
    ...QUERY_CONFIGS.detail,
  });
};

// Create a class
export const useCreateClass = (): UseMutationResult<Class, Error, CreateClassRequest> => {
  const queryClient = useQueryClient();

  const standardOptions = createStandardMutationOptions({
    entity: "Class",
    operation: "create",
  });

  return useMutation({
    mutationFn: classApi.create,
    onSuccess: (newClass) => {
      queryClient.setQueryData(classKeys.detail(newClass.id), newClass);
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      standardOptions.onSuccess?.(newClass);
    },
    onError: standardOptions.onError,
  });
};

// Update a class
export const useUpdateClass = (): UseMutationResult<
  Class,
  Error,
  { id: string; data: UpdateClassRequest }
> => {
  const queryClient = useQueryClient();

  const standardOptions = createStandardMutationOptions({
    entity: "Class",
    operation: "update",
  });

  return useMutation({
    mutationFn: ({ id, data }) => classApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: classKeys.detail(id) });

      const previousClass = queryClient.getQueryData(classKeys.detail(id));

      queryClient.setQueryData(classKeys.detail(id), (old: Class) =>
        old ? { ...old, ...data } : null
      );

      return { previousClass };
    },
    onError: (err, variables, context) => {
      if (context?.previousClass) {
        queryClient.setQueryData(classKeys.detail(variables.id), context.previousClass);
      }
      standardOptions.onError?.(err);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: classKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      standardOptions.onSettled?.(data, error, variables as any);
    },
    onSuccess: () => {
      standardOptions.onSuccess?.(undefined);
    },
  });
};

// Archive a class
export const useArchiveClass = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  const standardOptions = createStandardMutationOptions({
    entity: "Class",
    operation: "archive",
  });

  return useMutation({
    mutationFn: classApi.archive,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: classKeys.detail(id) });

      const previousClass = queryClient.getQueryData(classKeys.detail(id));

      queryClient.setQueryData(classKeys.detail(id), (old: Class) =>
        old ? { ...old, archived: true } : null
      );

      return { previousClass };
    },
    onError: (err, variables, context) => {
      if (context?.previousClass) {
        queryClient.setQueryData(classKeys.detail(variables), context.previousClass);
      }
      standardOptions.onError?.(err);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: classKeys.detail(variables) });
      queryClient.invalidateQueries({ queryKey: classKeys.lists() });
      standardOptions.onSettled?.(data, error, variables as any);
    },
    onSuccess: () => {
      standardOptions.onSuccess?.(undefined);
    },
  });
};

// Get enrollments for a class
export const useClassEnrollments = (classId: string): UseQueryResult<EnrollmentResponse[], Error> => {
  return useQuery({
    queryKey: enrollmentKeys.byClass(classId),
    queryFn: () => classApi.getEnrollments(classId),
    enabled: !!classId,
    ...QUERY_CONFIGS.detail,
    staleTime: 1000 * 30, // 30 seconds for enrollment data
  });
};

// Enroll a student in a class
export const useEnrollStudent = (): UseMutationResult<
  EnrollmentResponse | EnrollOverflowResponse,
  Error,
  { classId: string; studentId: string }
> => {
  const queryClient = useQueryClient();

  const standardOptions = createStandardMutationOptions({
    entity: "Enrollment",
    operation: "enroll",
  });

  return useMutation({
    mutationFn: ({ classId, studentId }) => classApi.enroll(classId, studentId),
    onMutate: async ({ classId, studentId }) => {
      await queryClient.cancelQueries({ queryKey: enrollmentKeys.byClass(classId) });

      const previousEnrollments = queryClient.getQueryData(enrollmentKeys.byClass(classId));

      // Optimistically add a pending enrollment
      queryClient.setQueryData(enrollmentKeys.byClass(classId), (old: EnrollmentResponse[] = []) => [
        ...old,
        {
          id: `temp-${Date.now()}`,
          class_id: classId,
          student_id: studentId,
          status: "pending" as const,
        },
      ]);

      return { previousEnrollments };
    },
    onError: (err, variables, context) => {
      if (context?.previousEnrollments) {
        queryClient.setQueryData(enrollmentKeys.byClass(variables.classId), context.previousEnrollments);
      }
      standardOptions.onError?.(err);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.byClass(variables.classId) });
      standardOptions.onSettled?.(data, error, variables as any);
    },
    onSuccess: (result) => {
      if ('overflow' in result) {
        showWarningToast(result.message);
      } else {
        standardOptions.onSuccess?.(result);
      }
    },
  });
};

// Update enrollment status
export const useUpdateEnrollment = (): UseMutationResult<
  EnrollmentResponse,
  Error,
  { classId: string; enrollmentId: string; status: "active" | "pending" | "removed" }
> => {
  const queryClient = useQueryClient();

  const standardOptions = createStandardMutationOptions({
    entity: "Enrollment",
    operation: "update",
  });

  return useMutation({
    mutationFn: ({ classId, enrollmentId, status }) =>
      classApi.updateEnrollment(classId, enrollmentId, status),
    onMutate: async ({ classId, enrollmentId, status }) => {
      await queryClient.cancelQueries({ queryKey: enrollmentKeys.byClass(classId) });

      const previousEnrollments = queryClient.getQueryData(enrollmentKeys.byClass(classId));

      queryClient.setQueryData(enrollmentKeys.byClass(classId), (old: EnrollmentResponse[] = []) =>
        old.map(enrollment =>
          enrollment.id === enrollmentId ? { ...enrollment, status } : enrollment
        )
      );

      return { previousEnrollments };
    },
    onError: (err, variables, context) => {
      if (context?.previousEnrollments) {
        queryClient.setQueryData(enrollmentKeys.byClass(variables.classId), context.previousEnrollments);
      }
      standardOptions.onError?.(err);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.byClass(variables.classId) });
      standardOptions.onSettled?.(data, error, variables as any);
    },
    onSuccess: (_, variables) => {
      showSuccessToast("update", "Enrollment status");
    },
  });
};

// Remove an enrollment
export const useRemoveEnrollment = (): UseMutationResult<
  { success: true },
  Error,
  { classId: string; enrollmentId: string }
> => {
  const queryClient = useQueryClient();

  const standardOptions = createStandardMutationOptions({
    entity: "Enrollment",
    operation: "unenroll",
  });

  return useMutation({
    mutationFn: ({ classId, enrollmentId }) => classApi.removeEnrollment(classId, enrollmentId),
    onMutate: async ({ classId, enrollmentId }) => {
      await queryClient.cancelQueries({ queryKey: enrollmentKeys.byClass(classId) });

      const previousEnrollments = queryClient.getQueryData(enrollmentKeys.byClass(classId));

      queryClient.setQueryData(enrollmentKeys.byClass(classId), (old: EnrollmentResponse[] = []) =>
        old.filter(enrollment => enrollment.id !== enrollmentId)
      );

      return { previousEnrollments };
    },
    onError: (err, variables, context) => {
      if (context?.previousEnrollments) {
        queryClient.setQueryData(enrollmentKeys.byClass(variables.classId), context.previousEnrollments);
      }
      standardOptions.onError?.(err);
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: enrollmentKeys.byClass(variables.classId) });
      standardOptions.onSettled?.(data, error, variables as any);
    },
    onSuccess: () => {
      standardOptions.onSuccess?.(undefined);
    },
  });
};