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
