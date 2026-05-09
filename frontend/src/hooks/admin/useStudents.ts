// frontend/src/hooks/admin/useStudents.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseMutationResult,
  UseQueryResult,
} from "@tanstack/react-query";
import { studentApi } from "@/api/admin/student.api";
import type { Student, BulkImportResult } from "@/types/admin/student.types";
import type {
  CreateStudentRequest,
  CreateStudentResponse,
  UpdateStudentRequest,
  UpdateStudentStatusRequest,
  GetStudentsQuery,
} from "@/api/admin/student.api";
import { studentKeys } from "@/hooks/queryKeys";
import { toast } from "sonner";

export const useStudents = (
  query?: GetStudentsQuery,
): UseQueryResult<Student[], unknown> => {
  return useQuery<Student[], unknown>({
    queryKey: studentKeys.list(query),
    queryFn: () => studentApi.getAll(query),
    staleTime: 1000 * 60, // 1 minute for student lists
  });
};

export const useStudent = (id: string): UseQueryResult<Student, unknown> => {
  return useQuery<Student, unknown>({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentApi.getOne(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes for individual student data
  });
};

export const useCreateStudent = (): UseMutationResult<
  CreateStudentResponse,
  unknown,
  CreateStudentRequest
> => {
  const queryClient = useQueryClient();
  return useMutation<CreateStudentResponse, unknown, CreateStudentRequest>({
    mutationFn: studentApi.create,
    onSuccess: (newStudent) => {
      // Add new student to cache immediately
      queryClient.setQueryData(studentKeys.detail(newStudent.id), newStudent);
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      toast.success("Student created successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create student");
    },
  });
};

export const useUpdateStudent = (): UseMutationResult<
  Student,
  unknown,
  { id: string; data: UpdateStudentRequest }
> => {
  const queryClient = useQueryClient();
  return useMutation<Student, unknown, { id: string; data: UpdateStudentRequest }>({
    mutationFn: ({ id, data }) => studentApi.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: studentKeys.detail(id) });

      // Snapshot the previous value
      const previousStudent = queryClient.getQueryData(studentKeys.detail(id));

      // Optimistically update to the new value
      queryClient.setQueryData(studentKeys.detail(id), (old: Student) =>
        old ? { ...old, ...data } : null
      );

      return { previousStudent };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousStudent) {
        queryClient.setQueryData(studentKeys.detail(variables.id), context.previousStudent);
      }
      toast.error("Failed to update student");
    },
    onSettled: (data, error, variables) => {
      // Refetch to ensure server state is reflected
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
    onSuccess: () => {
      toast.success("Student updated successfully");
    },
  });
};

export const useUpdateStudentStatus = (): UseMutationResult<
  Student,
  unknown,
  { id: string; data: UpdateStudentStatusRequest }
> => {
  const queryClient = useQueryClient();
  return useMutation<Student, unknown, { id: string; data: UpdateStudentStatusRequest }>({
    mutationFn: ({ id, data }) => studentApi.updateStatus(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: studentKeys.detail(id) });

      const previousStudent = queryClient.getQueryData(studentKeys.detail(id));

      queryClient.setQueryData(studentKeys.detail(id), (old: Student) =>
        old ? { ...old, status: data.status } : null
      );

      return { previousStudent };
    },
    onError: (err, variables, context) => {
      if (context?.previousStudent) {
        queryClient.setQueryData(studentKeys.detail(variables.id), context.previousStudent);
      }
      toast.error("Failed to update student status");
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
    },
    onSuccess: (_, variables) => {
      toast.success(`Student status updated to ${variables.data.status}`);
    },
  });
};

export const useResetStudentPassword = (): UseMutationResult<
  { password: string },
  unknown,
  string
> => {
  return useMutation<{ password: string }, unknown, string>({
    mutationFn: async (id: string) => {
      const { plainPassword } = await studentApi.resetPassword(id);
      return { password: plainPassword }; // renamed — never expose raw field name in UI layer
    },
  });
};

export const useBulkImportStudents = (): UseMutationResult<
  BulkImportResult,
  unknown,
  File
> => {
  const queryClient = useQueryClient();
  return useMutation<BulkImportResult, unknown, File>({
    mutationFn: studentApi.bulkImport,
    onSuccess: (result) => {
      if (result.status === "success") {
        queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
        toast.success(`Successfully imported ${result.importedCount} students`);
      } else {
        toast.error(`Import failed: ${result.errors?.join(', ') || 'Unknown error'}`);
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to import students");
    },
  });
};