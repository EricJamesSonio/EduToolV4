// ===== File: frontend/src/hooks/admin/useSchoolYears.ts

import {
  useAsyncQuery,
  useMutationWithInvalidation,
} from "@/hooks/hook-factory.utils";

import { schoolYearApi } from "@/api/admin/school-year.api";
import { programApi } from "@/api/admin/program.api";
import { sectionApi } from "@/api/admin/section.api";
import { courseApi } from "@/api/admin/course.api";

import { queryKeys } from "@/hooks/queryKeys.factory";

import type {
  SchoolYear,
} from "@/types/admin/school-year.types";

// NOTE: School-year keys now come exclusively from the centralized
// `queryKeys` factory (queryKeys.admin.schoolYears.*) instead of a local,
// hand-rolled key set. The previous local keys ("admin","school-years")
// used a different string/shape than the factory's ("admin","schoolYears"),
// so mutations elsewhere in the app (e.g. CreateSchoolYearDialog, which
// invalidates via the factory) never matched this query's key and the
// selector never refetched without a full page reload.
//
// The remaining scoped keys (programs/sections/courses by school year) are
// left as local keys since nothing else in the app invalidates them via the
// factory today — changing them is out of scope for this fix.
const scopedKeys = {
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
    courseId?: string,
    strandId?: string,
  ) =>
    [
      "admin",
      "sections",
      schoolYearId,
      levelId,
      courseId,
      strandId,
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
    queryKeys.admin.schoolYears.list(),
    schoolYearApi.getAll,
  );
};


export const useCreateSchoolYear =
  () => {
    return useMutationWithInvalidation(
      schoolYearApi.create,

      {
        invalidateKeys: [
          queryKeys.admin.schoolYears.all,
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
          queryKeys.admin.schoolYears.all,
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
          queryKeys.admin.schoolYears.all,
        ],
      },
    );
  };


export const useDeleteSchoolYear =
  () => {
    return useMutationWithInvalidation(
      schoolYearApi.remove,

      {
        invalidateKeys: [
          queryKeys.admin.schoolYears.all,
        ],
      },
    );
  };


// ─── Scoped by School Year ───────────────────────

export const usePrograms = (
  schoolYearId: string | null,
) => {
  return useAsyncQuery(
    scopedKeys.programs(
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
  courseId?: string,
  strandId?: string,
) => {
  return useAsyncQuery(
    scopedKeys.sections(
      schoolYearId,
      levelId,
      courseId,
      strandId,
    ),

    () =>
      sectionApi.getAll(
        schoolYearId!,
        levelId,
        courseId,
        strandId,
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
    scopedKeys.courses(
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