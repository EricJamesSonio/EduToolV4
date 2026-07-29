// frontend/src/hooks/admin/useStudents.ts

import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";

import { studentApi } from "@/api/admin/student.api";
import { queryKeys } from "@/hooks/queryKeys.factory";

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
    queryKeys.admin.students.list(query),
    () => studentApi.getAll(query),
    {
      meta: { preset: 'list', feature: 'students' },
    },
  );
};


// ── DETAIL ───────────────────────────────────────────

export const useStudent = (id: string) => {
  return useAsyncQuery<Student>(
    queryKeys.admin.students.detail(id),
    () => studentApi.getOne(id),
    {
      meta: { preset: 'detail', feature: 'students' },
      enabled: !!id,
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
        queryKeys.admin.students.all,
      ],

      onSuccess: (newStudent) => {
        queryClient.setQueryData(
          queryKeys.admin.students.detail(newStudent.id),
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
        queryKey: queryKeys.admin.students.detail(id),
      });

      const previous =
        queryClient.getQueryData<Student>(
          queryKeys.admin.students.detail(id),
        );

      queryClient.setQueryData<Student>(
        queryKeys.admin.students.detail(id),
        (old) =>
          old ? { ...old, ...data } : old,
      );

      try {
        const result =
          await studentApi.update(id, data);

        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.students.detail(id),
        });

        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.students.all,
        });

        toast.success(
          "Student updated successfully",
        );

        return result;
      } catch (err) {
        if (previous) {
          queryClient.setQueryData(
            queryKeys.admin.students.detail(id),
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
        queryKey: queryKeys.admin.students.detail(id),
      });

      const previous =
        queryClient.getQueryData<Student>(
          queryKeys.admin.students.detail(id),
        );

      queryClient.setQueryData<Student>(
        queryKeys.admin.students.detail(id),
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
          queryKey: queryKeys.admin.students.detail(id),
        });

        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.students.all,
        });

        toast.success(
          `Student status updated to ${data.status}`,
        );

        return result;
      } catch (err) {
        if (previous) {
          queryClient.setQueryData(
            queryKeys.admin.students.detail(id),
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
          queryKeys.admin.students.all,
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