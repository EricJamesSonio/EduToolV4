import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { subjectPrerequisiteApi } from "@/api/admin/subject-prerequisite.api";

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
