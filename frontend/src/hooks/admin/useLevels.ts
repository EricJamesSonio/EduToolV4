// ===== File: frontend/src/hooks/admin/useLevels.ts

import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import {
  levelApi,
  type UpdateDefaultLevelsRequest,
} from "@/api/admin/level.api";
import type {
  Level,
  LevelDefault,
} from "@/types/admin/level.types";


// ── GET default levels ─────────────────────────────────────

export const useDefaultLevels = () => {
  return useAsyncQuery<LevelDefault[]>(
    queryKeys.admin.levels.enriched(),
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
          queryKeys.admin.levels.all,
          queryKeys.admin.schoolYears.readiness(),
        ],
      },
    );
  };


// ── GET levels by school year ─────────────────────────────

export const useLevelsByYear = (
  schoolYearId: string,
) => {
  return useAsyncQuery<Level[]>(
    queryKeys.admin.levels.list({ schoolYearId }),
    () => levelApi.getBySchoolYear(schoolYearId),

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
        queryKeys.admin.levels.all,
        queryKeys.admin.schoolYears.readiness(),
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
    queryKeys.admin.levels.list({ schoolYearId }),
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
    [...queryKeys.admin.levels.all, 'byCourse', schoolYearId, courseId] as const,
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
    [...queryKeys.admin.levels.all, 'byStrand', schoolYearId, strandId] as const,
    () => levelApi.getByStrand(schoolYearId, strandId),
    { enabled: !!schoolYearId && !!strandId },
  );
};