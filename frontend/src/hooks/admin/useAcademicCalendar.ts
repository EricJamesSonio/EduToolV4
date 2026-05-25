import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { useMutationWithInvalidation } from "@/hooks/hook-factory.utils";

import { queryKeys } from "@/hooks/queryKeys.factory";
import { semesterApi } from "@/api/admin/semester.api";

import type {
  CreateSemesterRequest,
  UpdateSemesterRequest,
} from "@/api/admin/semester.api";

import type {
  Semester,
} from "@/types/admin/semester.types";


export const useSemesters = () => {
  return useAsyncQuery(
    queryKeys.admin.semesters.list(),
    semesterApi.getAll,
  );
};


export const useCreateSemester = () => {
  return useMutationWithInvalidation(
    (data: CreateSemesterRequest) =>
      semesterApi.create(data),
    {
      invalidateKeys: [
        queryKeys.admin.semesters.list(),
      ],
    },
  );
};


export const useUpdateSemester = () => {
  return useMutationWithInvalidation(
    ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSemesterRequest;
    }) =>
      semesterApi.update(id, data),

    {
      invalidateKeys: [
        queryKeys.admin.semesters.list(),
      ],
    },
  );
};


export const useDeleteSemester = () => {
  return useMutationWithInvalidation(
    (id: string) =>
      semesterApi.delete(id),

    {
      invalidateKeys: [
        queryKeys.admin.semesters.list(),
      ],
    },
  );
};