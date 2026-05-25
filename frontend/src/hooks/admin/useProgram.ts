// ===== File: frontend/src/hooks/admin/usePrograms.ts

import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";

import { programApi } from "@/api/admin/program.api";

import type {
  CreateProgramRequest,
  UpdateProgramRequest,
} from "@/api/admin/program.api";

import type {
  Program,
} from "@/types/admin/program.types";

const programKeys = {
  all: ["programs"] as const,

  list: (schoolYearId?: string) =>
    ["programs", schoolYearId] as const,

  detail: (id: string) =>
    ["admin", "programs", id] as const,
};


// ── GET programs by school year ─────────────────────────

export const usePrograms = (
  schoolYearId?: string,
) => {
  return useAsyncQuery<Program[]>(
    programKeys.list(
      schoolYearId,
    ),

    () =>
      programApi.getAll(
        schoolYearId!,
      ),

    {
      enabled: !!schoolYearId,
    },
  );
};


// ── CREATE program ──────────────────────────────────────

export const useCreateProgram = () => {
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
        return {
          invalidateKeys: [
            programKeys.list(
              variables.schoolYearId,
            ),
          ],
        };
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
          programKeys.all,
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
          programKeys.all,
        ],
      },
    );
  };


// ── GET program detail ──────────────────────────────────

export const useProgramDetail = (
  id: string,
) => {
  return useAsyncQuery<Program>(
    programKeys.detail(id),

    () =>
      programApi.getOne(id),

    {
      enabled: !!id,
    },
  );
};