// ===== File: frontend/src/hooks/admin/useSemesters.ts

import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";

import {
  semesterApi,
  type CreateSemesterRequest,
  type UpdateSemesterRequest,
} from "@/api/admin/semester.api";

import type {
  Semester,
} from "@/types/admin/semester.types";


const semesterKeys = {
  all: ["semesters"] as const,
};


// ── GET all semesters ─────────────────────────────

export const useSemesters = () => {
  return useAsyncQuery<Semester[]>(
    semesterKeys.all,
    semesterApi.getAll,
  );
};


// ── CREATE semester ──────────────────────────────

export const useCreateSemester =
  () => {
    return useMutationWithInvalidation(
      (
        data: CreateSemesterRequest,
      ) =>
        semesterApi.create(
          data,
        ),

      {
        invalidateKeys: [
          semesterKeys.all,
        ],
      },
    );
  };


// ── UPDATE semester ──────────────────────────────

export const useUpdateSemester =
  () => {
    return useMutationWithInvalidation(
      ({
        id,
        data,
      }: {
        id: string;
        data: UpdateSemesterRequest;
      }) =>
        semesterApi.update(
          id,
          data,
        ),

      {
        invalidateKeys: [
          semesterKeys.all,
        ],
      },
    );
  };


// ── DELETE semester ──────────────────────────────

export const useDeleteSemester =
  () => {
    return useMutationWithInvalidation(
      (id: string) =>
        semesterApi.delete(id),

      {
        invalidateKeys: [
          semesterKeys.all,
        ],
      },
    );
  };