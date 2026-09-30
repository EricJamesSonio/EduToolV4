import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import {
  subjectPrerequisiteApi,
  subjectPrerequisiteBatchApi,
} from "@/api/admin/subject-prerequisite.api";

export const useSubjectPrerequisites = (subjectId: string | null) => {
  return useAsyncQuery(
    [...queryKeys.admin.subjects.detail(subjectId ?? "none"), "prerequisites"] as const,
    () => subjectPrerequisiteApi.getBySubject(subjectId!),
    {
      enabled: !!subjectId,
      meta: { preset: "detail", feature: "subject-prerequisites" },
    },
  );
};

export const useCreatePrerequisite = (subjectId: string) => {
  return useMutationWithInvalidation(
    (prerequisiteId: string) => subjectPrerequisiteApi.create(subjectId, prerequisiteId),
    {
      invalidateKeys: [[...queryKeys.admin.subjects.detail(subjectId), "prerequisites"] as const],
    },
  );
};

export const useBulkSetPrerequisites = (subjectId: string) => {
  return useMutationWithInvalidation(
    (prerequisiteIds: string[]) => subjectPrerequisiteApi.bulkCreate(subjectId, prerequisiteIds),
    {
      invalidateKeys: [[...queryKeys.admin.subjects.detail(subjectId), "prerequisites"] as const],
    },
  );
};

export const useRemovePrerequisite = (subjectId: string) => {
  return useMutationWithInvalidation(
    (prerequisiteId: string) => subjectPrerequisiteApi.remove(subjectId, prerequisiteId),
    {
      invalidateKeys: [[...queryKeys.admin.subjects.detail(subjectId), "prerequisites"] as const],
    },
  );
};

export const usePrerequisiteCheck = (subjectId: string | null, studentId: string | null) => {
  return useAsyncQuery(
    [...queryKeys.admin.subjects.detail(subjectId ?? "none"), "prerequisite-check", studentId ?? "none"] as const,
    () => subjectPrerequisiteApi.check(subjectId!, studentId!),
    {
      enabled: !!subjectId && !!studentId,
      meta: { preset: "detail", feature: "subject-prerequisites" },
    },
  );
};
/**
 * Batched prerequisite check for one class subject against many students.
 *
 * Backs the admin enrollment surfaces, which render a section of students for
 * a single class and need to know which of them the server-side enroll gate
 * would reject. Disabled until it has a subject and at least one student, so
 * collapsing a class costs nothing.
 *
 * Student ids are sorted into the cache key, so selection-order differences
 * between renders do not produce duplicate cache entries for the same set.
 */
export const useSubjectsPrerequisiteCheck = (
  subjectId: string | null,
  studentIds: string[],
) => {
  return useAsyncQuery(
    queryKeys.admin.subjectPrerequisites.checkBatch(
      subjectId ? [subjectId] : [],
      studentIds,
    ),
    () =>
      subjectPrerequisiteBatchApi.checkBatch(
        subjectId ? [subjectId] : [],
        studentIds,
      ),
    {
      enabled: !!subjectId && studentIds.length > 0,
      meta: { preset: 'detail', feature: 'subject-prerequisites' },
    },
  );
};