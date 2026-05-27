// ===== File: frontend/src/hooks/admin/useLevels.ts

import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";

import {
  levelApi,
  type UpdateDefaultLevelsRequest,
} from "@/api/admin/level.api";

import type {
  Level,
  LevelDefault,
} from "@/types/admin/level.types";

const levelKeys = {
  all: ["levels"] as const,

  defaults: () =>
    ["levels", "defaults"] as const,

  byYear: (schoolYearId: string) =>
    ["levels", schoolYearId] as const,

  byCourse: (schoolYearId: string, courseId: string) =>
    ["levels", schoolYearId, "course", courseId] as const,

  byStrand: (schoolYearId: string, strandId: string) =>
    ["levels", schoolYearId, "strand", strandId] as const,
};


// ── GET default levels ─────────────────────────────────────

export const useDefaultLevels = () => {
  return useAsyncQuery<LevelDefault[]>(
    levelKeys.defaults(),
    levelApi.getDefaults,
  );
};


// ── UPDATE default levels ─────────────────────────────────

export const useUpdateDefaultLevels =
  () => {
    return useMutationWithInvalidation(
      (
        data: UpdateDefaultLevelsRequest,
      ) =>
        levelApi.updateDefaults(data),

      {
        invalidateKeys: [
          levelKeys.all,
        ],
      },
    );
  };


// ── GET levels by school year ─────────────────────────────

export const useLevelsByYear = (
  schoolYearId: string,
) => {
  return useAsyncQuery<Level[]>(
    levelKeys.byYear(
      schoolYearId,
    ),

    () =>
      levelApi.getBySchoolYear(
        schoolYearId,
      ),

    {
      enabled: !!schoolYearId,
    },
  );
};


// ── UPDATE single level ───────────────────────────────────

export const useUpdateLevel = () => {
  return useMutationWithInvalidation(
    ({
      id,
      name,
    }: {
      id: string;
      name: string;
    }) =>
      levelApi.updateOne(
        id,
        name,
      ),

    {
      invalidateKeys: [
        levelKeys.all,
      ],
    },
  );
};


// ── GET levels by school year (scoped to program, excluding course/strand levels) ──

export const useLevelsByProgram = (
  programId: string,
  schoolYearId: string,
) => {
  return useAsyncQuery<Level[]>(
    levelKeys.byYear(schoolYearId),
    () => levelApi.getBySchoolYear(schoolYearId, programId),
    { enabled: !!schoolYearId && !!programId },
  );
};


// ── GET levels by course ──

export const useLevelsByCourse = (
  schoolYearId: string,
  courseId: string,
) => {
  return useAsyncQuery<Level[]>(
    levelKeys.byCourse(schoolYearId, courseId),
    () => levelApi.getByCourse(schoolYearId, courseId),
    { enabled: !!schoolYearId && !!courseId },
  );
};


// ── GET levels by strand ──

export const useLevelsByStrand = (
  schoolYearId: string,
  strandId: string,
) => {
  return useAsyncQuery<Level[]>(
    levelKeys.byStrand(schoolYearId, strandId),
    () => levelApi.getByStrand(schoolYearId, strandId),
    { enabled: !!schoolYearId && !!strandId },
  );
};