// frontend/src/hooks/admin/useStudents.ts

import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";

import { studentApi } from "@/api/admin/student.api";
import { studentKeys } from "@/hooks/queryKeys";

import { toast } from "sonner";

import type {
  Student,
  BulkImportResult,
} from "@/types/admin/student.types";

import type {
  CreateStudentRequest,
  CreateStudentResponse,
  UpdateStudentRequest,
  UpdateStudentStatusRequest,
  GetStudentsQuery,
} from "@/api/admin/student.api";

import { useQueryClient } from "@tanstack/react-query";


// ── LIST ─────────────────────────────────────────────

export const useStudents = (
  query?: GetStudentsQuery,
) => {
  return useAsyncQuery<Student[]>(
    studentKeys.list(query),
    () => studentApi.getAll(query),
    {
      staleTime: 1000 * 60,
    },
  );
};


// ── DETAIL ───────────────────────────────────────────

export const useStudent = (id: string) => {
  return useAsyncQuery<Student>(
    studentKeys.detail(id),
    () => studentApi.getOne(id),
    {
      enabled: !!id,
      staleTime: 1000 * 60 * 5,
    },
  );
};


// ── CREATE ───────────────────────────────────────────

export const useCreateStudent = () => {
  const queryClient = useQueryClient();

  return useMutationWithInvalidation(
    (data: CreateStudentRequest) =>
      studentApi.create(data),

    {
      invalidateKeys: [
        studentKeys.lists(),
      ],

      onSuccess: (newStudent) => {
        queryClient.setQueryData(
          studentKeys.detail(newStudent.id),
          newStudent,
        );

        toast.success(
          "Student created successfully",
        );
      },

      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message ||
            "Failed to create student",
        );
      },
    },
  );
};


// ── UPDATE (optimistic) ─────────────────────────────

export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return {
    mutate: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateStudentRequest;
    }) => {
      await queryClient.cancelQueries({
        queryKey: studentKeys.detail(id),
      });

      const previous =
        queryClient.getQueryData<Student>(
          studentKeys.detail(id),
        );

      queryClient.setQueryData<Student>(
        studentKeys.detail(id),
        (old) =>
          old ? { ...old, ...data } : old,
      );

      try {
        const result =
          await studentApi.update(id, data);

        queryClient.invalidateQueries({
          queryKey: studentKeys.detail(id),
        });

        queryClient.invalidateQueries({
          queryKey: studentKeys.lists(),
        });

        toast.success(
          "Student updated successfully",
        );

        return result;
      } catch (err) {
        if (previous) {
          queryClient.setQueryData(
            studentKeys.detail(id),
            previous,
          );
        }

        toast.error(
          "Failed to update student",
        );

        throw err;
      }
    },
  };
};


// ── UPDATE STATUS (optimistic) ───────────────────────

export const useUpdateStudentStatus = () => {
  const queryClient = useQueryClient();

  return {
    mutate: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateStudentStatusRequest;
    }) => {
      await queryClient.cancelQueries({
        queryKey: studentKeys.detail(id),
      });

      const previous =
        queryClient.getQueryData<Student>(
          studentKeys.detail(id),
        );

      queryClient.setQueryData<Student>(
        studentKeys.detail(id),
        (old) =>
          old
            ? {
                ...old,
                status: data.status,
              }
            : old,
      );

      try {
        const result =
          await studentApi.updateStatus(
            id,
            data,
          );

        queryClient.invalidateQueries({
          queryKey: studentKeys.detail(id),
        });

        queryClient.invalidateQueries({
          queryKey: studentKeys.lists(),
        });

        toast.success(
          `Student status updated to ${data.status}`,
        );

        return result;
      } catch (err) {
        if (previous) {
          queryClient.setQueryData(
            studentKeys.detail(id),
            previous,
          );
        }

        toast.error(
          "Failed to update student status",
        );

        throw err;
      }
    },
  };
};


// ── RESET PASSWORD ────────────────────────────────────

export const useResetStudentPassword =
  () => {
    return useMutationWithInvalidation(
      async (id: string) => {
        const res =
          await studentApi.resetPassword(id);

        return {
          password:
            res.plainPassword,
        };
      },
    );
  };


// ── BULK IMPORT ──────────────────────────────────────

export const useBulkImportStudents =
  () => {
    const queryClient = useQueryClient();

    return useMutationWithInvalidation(
      (file: File) =>
        studentApi.bulkImport(file),

      {
        invalidateKeys: [
          studentKeys.lists(),
        ],

        onSuccess: (result) => {
          if (
            result.status ===
            "success"
          ) {
            toast.success(
              `Successfully imported ${result.importedCount} students`,
            );
          } else {
            toast.error(
              `Import failed: ${result.errors?.join(
                ", ",
              )}`,
            );
          }
        },

        onError: (error: any) => {
          toast.error(
            error?.response?.data
              ?.message ||
              "Failed to import students",
          );
        },
      },
    );
  };