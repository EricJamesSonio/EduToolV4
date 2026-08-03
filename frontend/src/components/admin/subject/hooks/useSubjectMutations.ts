import { toast } from "sonner";
import { subjectApi } from "@/api/admin/subject.api";
import type { Subject } from "@/types/admin/subject.types";
import type { AxiosError } from "axios";
import { useMutationWithInvalidation } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";

export function useSubjectMutations(
  setLockTarget: (target: Subject | null) => void,
  setUnlockTarget: (target: Subject | null) => void
) {
  const lockMutation = useMutationWithInvalidation(
    (id: string) => subjectApi.lock(id),
    {
      invalidateKeys: [queryKeys.admin.subjects.all],
      onSuccess: () => {
        toast.success("Subject locked.");
        setLockTarget(null);
      },
      onError: (err: AxiosError<{ message: string }>) => {
        toast.error(err?.response?.data?.message ?? "Failed to lock subject.");
        setLockTarget(null);
      },
    }
  );

  const unlockMutation = useMutationWithInvalidation(
    (id: string) => subjectApi.unlock(id),
    {
      invalidateKeys: [queryKeys.admin.subjects.all],
      onSuccess: () => {
        toast.success("Subject unlocked.");
        setUnlockTarget(null);
      },
      onError: (err: AxiosError<{ message: string }>) => {
        toast.error(
          err?.response?.data?.message ?? "Failed to unlock subject."
        );
        setUnlockTarget(null);
      },
    }
  );

  return { lockMutation, unlockMutation };
}