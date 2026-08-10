import { UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { classApi } from "@/api/admin/class.api";
import type {
  GetClassesQuery,
  CreateClassRequest,
  UpdateClassRequest,
  EnrollmentResponse,
  EnrollOverflowResponse,
} from "@/api/admin/class.api";
import type { Class } from "@/types/admin/class.types";
import { toast } from "sonner";

// Fetch all classes
export const useClasses = (query?: GetClassesQuery): UseQueryResult<Class[], Error> => {
  return useAsyncQuery<Class[]>(
    query ? [...queryKeys.admin.classes.list(query)] as const : queryKeys.admin.classes.list(),
    () => classApi.getAll(query),
    {
      staleTime: 1000 * 60,
    },
  );
};

// Fetch single class by ID
export const useClass = (id: string): UseQueryResult<Class, Error> => {
  return useAsyncQuery<Class>(
    queryKeys.admin.classes.detail(id),
    () => classApi.getOne(id),
    {
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
    },
  );
};

// Create a class
export const useCreateClass = (): UseMutationResult<Class, Error, CreateClassRequest> => {
  const queryClient = useQueryClient();

  return useMutationWithInvalidation<Class, Error, CreateClassRequest>(
    (data) => classApi.create(data),
    {
      invalidateKeys: [
        queryKeys.admin.classes.list(),
        queryKeys.admin.schoolYears.readiness(),
      ],
      onSuccess: (newClass) => {
        queryClient.setQueryData(queryKeys.admin.classes.detail(newClass.id), newClass);
        toast.success("Class created successfully");
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to create class");
      },
    },
  );
};

// Update a class
export const useUpdateClass = (): UseMutationResult<
  Class,
  Error,
  { id: string; data: UpdateClassRequest }
> => {
  const queryClient = useQueryClient();

  return useMutationWithInvalidation<Class, Error, { id: string; data: UpdateClassRequest }>(
    ({ id, data }) => classApi.update(id, data),
    {
      invalidateKeys: [
        queryKeys.admin.classes.list(),
        queryKeys.admin.schoolYears.readiness(),
      ],
      onMutate: async ({ id, data }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.admin.classes.detail(id) });

        const previousClass = queryClient.getQueryData(queryKeys.admin.classes.detail(id));

        queryClient.setQueryData(queryKeys.admin.classes.detail(id), (old: Class) =>
          old ? { ...old, ...data } : null
        );

        return { previousClass };
      },
      onError: (err, variables, context: any) => {
        if (context?.previousClass) {
          queryClient.setQueryData(queryKeys.admin.classes.detail(variables.id), context.previousClass);
        }
        toast.error("Failed to update class");
      },
      onSuccess: () => {
        toast.success("Class updated successfully");
      },
    },
  );
};

// Archive a class
export const useArchiveClass = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutationWithInvalidation<void, Error, string>(
    (id) => classApi.archive(id),
    {
      invalidateKeys: [
        queryKeys.admin.classes.list(),
        queryKeys.admin.schoolYears.readiness(),
      ],
      onMutate: async (id) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.admin.classes.detail(id) });

        const previousClass = queryClient.getQueryData(queryKeys.admin.classes.detail(id));

        queryClient.setQueryData(queryKeys.admin.classes.detail(id), (old: Class) =>
          old ? { ...old, archived: true } : null
        );

        return { previousClass };
      },
      onError: (err, variables, context: any) => {
        if (context?.previousClass) {
          queryClient.setQueryData(queryKeys.admin.classes.detail(variables), context.previousClass);
        }
        toast.error("Failed to archive class");
      },
      onSuccess: () => {
        toast.success("Class archived successfully");
      },
    },
  );
};

// Get enrollments for a class
export const useClassEnrollments = (classId: string): UseQueryResult<EnrollmentResponse[], Error> => {
  return useAsyncQuery<EnrollmentResponse[]>(
    queryKeys.admin.classes.enrolled(classId),
    () => classApi.getEnrollments(classId),
    {
      enabled: !!classId,
      staleTime: 1000 * 30,
    },
  );
};

// Enroll a student in a class
export const useEnrollStudent = (): UseMutationResult<
  EnrollmentResponse | EnrollOverflowResponse,
  Error,
  { classId: string; studentId: string }
> => {
  const queryClient = useQueryClient();

  return useMutationWithInvalidation<
    EnrollmentResponse | EnrollOverflowResponse,
    Error,
    { classId: string; studentId: string }
  >(
    ({ classId, studentId }) => classApi.enroll(classId, studentId),
    {
      invalidateKeys: [],
      onMutate: async ({ classId, studentId }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.admin.classes.enrolled(classId) });

        const previousEnrollments = queryClient.getQueryData(queryKeys.admin.classes.enrolled(classId));

        // Optimistically add a pending enrollment
        queryClient.setQueryData(queryKeys.admin.classes.enrolled(classId), (old: EnrollmentResponse[] = []) => [
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
      onError: (err, variables, context: any) => {
        if (context?.previousEnrollments) {
          queryClient.setQueryData(queryKeys.admin.classes.enrolled(variables.classId), context.previousEnrollments);
        }
        toast.error("Failed to enroll student");
      },
      onSuccess: (result, variables) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.classes.enrolled(variables.classId) });
        if ('overflow' in result) {
          toast.warning(result.message);
        } else {
          toast.success("Student enrolled successfully");
        }
      },
    },
  );
};

// Update enrollment status
export const useUpdateEnrollment = (): UseMutationResult<
  EnrollmentResponse,
  Error,
  { classId: string; enrollmentId: string; status: "active" | "pending" | "removed" }
> => {
  const queryClient = useQueryClient();

  return useMutationWithInvalidation<
    EnrollmentResponse,
    Error,
    { classId: string; enrollmentId: string; status: "active" | "pending" | "removed" }
  >(
    ({ classId, enrollmentId, status }) => classApi.updateEnrollment(classId, enrollmentId, status),
    {
      invalidateKeys: [],
      onMutate: async ({ classId, enrollmentId, status }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.admin.classes.enrolled(classId) });

        const previousEnrollments = queryClient.getQueryData(queryKeys.admin.classes.enrolled(classId));

        queryClient.setQueryData(queryKeys.admin.classes.enrolled(classId), (old: EnrollmentResponse[] = []) =>
          old.map(enrollment =>
            enrollment.id === enrollmentId ? { ...enrollment, status } : enrollment
          )
        );

        return { previousEnrollments };
      },
      onError: (err, variables, context: any) => {
        if (context?.previousEnrollments) {
          queryClient.setQueryData(queryKeys.admin.classes.enrolled(variables.classId), context.previousEnrollments);
        }
        toast.error("Failed to update enrollment status");
      },
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.classes.enrolled(variables.classId) });
        toast.success(`Enrollment status updated to ${variables.status}`);
      },
    },
  );
};

// Remove an enrollment
export const useRemoveEnrollment = (): UseMutationResult<
  { success: true },
  Error,
  { classId: string; enrollmentId: string }
> => {
  const queryClient = useQueryClient();

  return useMutationWithInvalidation<
    { success: true },
    Error,
    { classId: string; enrollmentId: string }
  >(
    ({ classId, enrollmentId }) => classApi.removeEnrollment(classId, enrollmentId),
    {
      invalidateKeys: [],
      onMutate: async ({ classId, enrollmentId }) => {
        await queryClient.cancelQueries({ queryKey: queryKeys.admin.classes.enrolled(classId) });

        const previousEnrollments = queryClient.getQueryData(queryKeys.admin.classes.enrolled(classId));

        queryClient.setQueryData(queryKeys.admin.classes.enrolled(classId), (old: EnrollmentResponse[] = []) =>
          old.filter(enrollment => enrollment.id !== enrollmentId)
        );

        return { previousEnrollments };
      },
      onError: (err, variables, context: any) => {
        if (context?.previousEnrollments) {
          queryClient.setQueryData(queryKeys.admin.classes.enrolled(variables.classId), context.previousEnrollments);
        }
        toast.error("Failed to remove enrollment");
      },
      onSuccess: (data, variables) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.classes.enrolled(variables.classId) });
        toast.success("Enrollment removed successfully");
      },
    },
  );
};