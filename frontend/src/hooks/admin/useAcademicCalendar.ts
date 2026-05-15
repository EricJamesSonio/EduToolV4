import { UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { useAsyncMutation, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { semesterApi } from "@/api/admin/semester.api";
import type { CreateSemesterRequest, UpdateSemesterRequest } from "@/api/admin/semester.api";
import type { Semester } from "@/types/admin/semester.types";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";

export const useSemesters = (): UseQueryResult<Semester[], Error> => {
  return useAsyncQuery<Semester[]>(
    queryKeys.admin.semesters.list(),
    () => semesterApi.getAll(),
  );
};

export const useCreateSemester = (): UseMutationResult<Semester, Error, CreateSemesterRequest> => {
  return useMutationWithInvalidation<Semester, Error, CreateSemesterRequest>(
    (data) => semesterApi.create(data),
    {
      invalidateKeys: [queryKeys.admin.semesters.list()],
    },
  );
};

export const useUpdateSemester = (): UseMutationResult<Semester, Error, { id: string; data: UpdateSemesterRequest }> => {
  return useMutationWithInvalidation<Semester, Error, { id: string; data: UpdateSemesterRequest }>(
    ({ id, data }) => semesterApi.update(id, data),
    {
      invalidateKeys: [queryKeys.admin.semesters.list()],
    },
  );
};

export const useDeleteSemester = (): UseMutationResult<void, Error, string> => {
  return useMutationWithInvalidation<void, Error, string>(
    (id) => semesterApi.delete(id),
    {
      invalidateKeys: [queryKeys.admin.semesters.list()],
    },
  );
};