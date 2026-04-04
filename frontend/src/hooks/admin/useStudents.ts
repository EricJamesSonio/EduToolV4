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

export const useStudents = (
  query?: GetStudentsQuery,
): UseQueryResult<Student[], unknown> => {
  return useQuery<Student[], unknown>({
    queryKey: ["students", query],
    queryFn: () => studentApi.getAll(query),
  });
};

export const useStudent = (id: string): UseQueryResult<Student, unknown> => {
  return useQuery<Student, unknown>({
    queryKey: ["students", id],
    queryFn: () => studentApi.getOne(id),
    enabled: !!id,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
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
        queryClient.invalidateQueries({ queryKey: ["students"] });
      }
    },
  });
};