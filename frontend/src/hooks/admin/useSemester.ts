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

// ── GET semesters of one school year (filtered server-side) ─────────
// Prefer this over fetching everything and filtering on the client: the
// API accepts schoolYearId and semesters are program-scoped since the
// program-scope migration, so a year can hold many rows.
export const useSemestersByYear = (schoolYearId: string | undefined) => {
  return useAsyncQuery<Semester[]>(
    queryKeys.admin.semesters.list({ schoolYearId }),
    () => semesterApi.getAll(schoolYearId!),
    { enabled: !!schoolYearId },
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