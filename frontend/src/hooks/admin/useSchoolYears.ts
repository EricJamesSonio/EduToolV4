// ===== File: frontend/src/hooks/admin/useSchoolYears.ts

import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";

import { schoolYearApi } from "@/api/admin/school-year.api";
import { programApi } from "@/api/admin/program.api";
import { sectionApi } from "@/api/admin/section.api";
import { courseApi } from "@/api/admin/course.api";

import type {
  SchoolYear,
} from "@/types/admin/school-year.types";

const schoolYearKeys = {
  schoolYears: {
    all: () =>
      ["admin", "school-years"] as const,
  },

  programs: (
    schoolYearId: string | null,
  ) =>
    [
      "admin",
      "programs",
      schoolYearId,
    ] as const,

  sections: (
    schoolYearId: string | null,
    levelId?: string,
  ) =>
    [
      "admin",
      "sections",
      schoolYearId,
      levelId,
    ] as const,

  courses: (
    schoolYearId: string | null,
    programId?: string,
  ) =>
    [
      "admin",
      "courses",
      schoolYearId,
      programId,
    ] as const,
};


// ─── School Years ─────────────────────────────────

export const useSchoolYears = () => {
  return useAsyncQuery<SchoolYear[]>(
    schoolYearKeys.schoolYears.all(),
    schoolYearApi.getAll,
  );
};


export const useCreateSchoolYear =
  () => {
    return useMutationWithInvalidation(
      schoolYearApi.create,

      {
        invalidateKeys: [
          schoolYearKeys
            .schoolYears
            .all(),
        ],
      },
    );
  };


export const useActivateSchoolYear =
  () => {
    return useMutationWithInvalidation(
      schoolYearApi.activate,

      {
        invalidateKeys: [
          schoolYearKeys
            .schoolYears
            .all(),
        ],
      },
    );
  };


export const useEndSchoolYear =
  () => {
    return useMutationWithInvalidation(
      schoolYearApi.end,

      {
        invalidateKeys: [
          schoolYearKeys
            .schoolYears
            .all(),
        ],
      },
    );
  };


// ─── Scoped by School Year ───────────────────────

export const usePrograms = (
  schoolYearId: string | null,
) => {
  return useAsyncQuery(
    schoolYearKeys.programs(
      schoolYearId,
    ),

    () =>
      programApi.getAll(
        schoolYearId!,
      ),

    {
      enabled:
        !!schoolYearId,
    },
  );
};


export const useSections = (
  schoolYearId: string | null,
  levelId?: string,
) => {
  return useAsyncQuery(
    schoolYearKeys.sections(
      schoolYearId,
      levelId,
    ),

    () =>
      sectionApi.getAll(
        schoolYearId!,
        levelId,
      ),

    {
      enabled:
        !!schoolYearId,
    },
  );
};


export const useCourses = (
  schoolYearId: string | null,
  programId?: string,
) => {
  return useAsyncQuery(
    schoolYearKeys.courses(
      schoolYearId,
      programId,
    ),

    () =>
      courseApi.getAll({
        schoolYearId:
          schoolYearId!,
        programId,
      }),

    {
      enabled:
        !!schoolYearId,
    },
  );
};