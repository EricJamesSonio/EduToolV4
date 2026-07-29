import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import {
  semesterApi,
  type CreateSemesterRequest,
  type UpdateSemesterRequest,
} from "@/api/admin/semester.api";
import type {
  Semester,
} from "@/types/admin/semester.types";


// ── GET all semesters ─────────────────────────────

export const useSemesters = () => {
  return useAsyncQuery<Semester[]>(
    queryKeys.admin.semesters.list(),
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
          queryKeys.admin.semesters.all,
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
          queryKeys.admin.semesters.all,
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
          queryKeys.admin.semesters.all,
        ],
      },
    );
  };