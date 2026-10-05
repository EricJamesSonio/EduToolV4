import { useAsyncQuery, useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { educatorGradeLockApi } from "@/api/educator/grade-lock.api";
import type { ClassLockInfo } from "@/types/admin/grade-lock.types";
import { toast } from "sonner";

export const useClassGradeLock = (classId: string) => {
  return useAsyncQuery<ClassLockInfo>(
    queryKeys.educator.gradeLock.list(classId),
    () => educatorGradeLockApi.getClassLockInfo(classId),
    { enabled: !!classId },
  );
};

export const useRequestUnlock = (classId: string) => {
  return useMutationWithInvalidation(
    (reason: string) =>
      educatorGradeLockApi.requestUnlock(classId, reason),
    {
      invalidateKeys: [queryKeys.educator.gradeLock.list(classId)],
      onSuccess: () => {
        toast.success("Unlock request submitted");
      },
    },
  );
};

/**
 * Locks every grade in the class. Locking publishes final scores and blocks
 * further edits, so both the grade tables (every term) and the lock info must
 * be refreshed. `grades.all` is a prefix key, so it covers
 * `grades.list(classId, termId)` for all terms as well as `grades.list(classId, "")`.
 */
export const useLockClassGrades = (classId: string) => {
  return useMutationWithInvalidation<void, unknown, void>(
    () => educatorGradeLockApi.lockClass(classId),
    {
      invalidateKeys: [
        queryKeys.educator.grades.all,
        queryKeys.educator.gradeLock.list(classId),
      ],
    },
  );
};

/**
 * Unlocks a class so grades become editable again. Same invalidation surface as
 * `useLockClassGrades` — both flip the lock state that gates every grade view.
 *
 * `reason` is required by the backend's `UnlockClassDto`.
 */
export const useUnlockClassGrades = (classId: string) => {
  return useMutationWithInvalidation<void, unknown, string>(
    (reason: string) => educatorGradeLockApi.unlockClass(classId, reason),
    {
      invalidateKeys: [
        queryKeys.educator.grades.all,
        queryKeys.educator.gradeLock.list(classId),
      ],
    },
  );
};
