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