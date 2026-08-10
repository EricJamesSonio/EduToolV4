import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { useQueryClient } from "@tanstack/react-query";
import { programApi } from "@/api/admin/program.api";
import type {
  CreateProgramRequest,
  UpdateProgramRequest,
} from "@/api/admin/program.api";
import type {
  Program,
} from "@/types/admin/program.types";


// ── GET programs by school year ─────────────────────────

export const usePrograms = (
  schoolYearId?: string,
) => {
  return useAsyncQuery<Program[]>(
    queryKeys.admin.programs.list({ schoolYearId }),
    () => programApi.getAll(schoolYearId!),

    {
      enabled: !!schoolYearId,
    },
  );
};


// ── CREATE program ──────────────────────────────────────

export const useCreateProgram = () => {
  const queryClient = useQueryClient();

  return useMutationWithInvalidation(
    (
      data: CreateProgramRequest,
    ) =>
      programApi.create(
        data,
      ),

    {
      onSuccess: (
        _,
        variables,
      ) => {
        // invalidate only affected bucket
        queryClient.invalidateQueries({
          queryKey: queryKeys.admin.programs.list({ schoolYearId: variables.schoolYearId }),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.admin.schoolYears.readiness() });
      },
    },
  );
};


// ── UPDATE program ──────────────────────────────────────

export const useUpdateProgram =
  () => {
    return useMutationWithInvalidation(
      ({
        id,
        data,
      }: {
        id: string;
        data: UpdateProgramRequest;
      }) =>
        programApi.update(
          id,
          data,
        ),

      {
        invalidateKeys: [
          queryKeys.admin.programs.all,
          queryKeys.admin.schoolYears.readiness(),
        ],
      },
    );
  };


// ── DELETE program ──────────────────────────────────────

export const useDeleteProgram =
  () => {
    return useMutationWithInvalidation(
      (id: string) =>
        programApi.delete(id),

      {
        invalidateKeys: [
          queryKeys.admin.programs.all,
          queryKeys.admin.schoolYears.readiness(),
        ],
      },
    );
  };


// ── GET program detail ──────────────────────────────────

export const useProgramDetail = (
  id: string,
) => {
  return useAsyncQuery<Program>(
    queryKeys.admin.programs.detail(id),
    () => programApi.getOne(id),

    {
      enabled: !!id,
    },
  );
};