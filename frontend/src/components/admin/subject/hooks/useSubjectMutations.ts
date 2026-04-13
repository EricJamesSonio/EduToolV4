import { useMutation, UseQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { subjectApi } from "@/api/admin/subject.api";
import type { Subject } from "@/types/admin/subject.types";
import type { AxiosError } from "axios";

export function useSubjectMutations(
  queryClient: any,
  setLockTarget: (target: Subject | null) => void,
  setUnlockTarget: (target: Subject | null) => void
) {
  const lockMutation = useMutation({
    mutationFn: (id: string) => subjectApi.lock(id),
    onSuccess: () => {
      toast.success("Subject locked.");
      queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] });
      setLockTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(err?.response?.data?.message ?? "Failed to lock subject.");
      setLockTarget(null);
    },
  });

  const unlockMutation = useMutation({
    mutationFn: (id: string) => subjectApi.unlock(id),
    onSuccess: () => {
      toast.success("Subject unlocked.");
      queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] });
      setUnlockTarget(null);
    },
    onError: (err: AxiosError<{ message: string }>) => {
      toast.error(
        err?.response?.data?.message ?? "Failed to unlock subject."
      );
      setUnlockTarget(null);
    },
  });

  return { lockMutation, unlockMutation };
}