import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { educatorGradeLockApi } from "@/api/educator/grade-lock.api";
import type { ClassLockInfo } from "@/types/admin/grade-lock.types";
import { toast } from "sonner";

export const GRADE_LOCK_KEY = "grade-lock";

export const useClassGradeLock = (classId: string) => {
  return useQuery<ClassLockInfo>({
    queryKey: [GRADE_LOCK_KEY, classId],
    queryFn: () => educatorGradeLockApi.getClassLockInfo(classId),
    enabled: !!classId,
  });
};

export const useRequestUnlock = (classId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) =>
      educatorGradeLockApi.requestUnlock(classId, reason),
    onSuccess: () => {
      toast.success("Unlock request submitted");
      qc.invalidateQueries({ queryKey: [GRADE_LOCK_KEY, classId] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? "Failed to request unlock");
    },
  });
};
