import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { gradeLockApi } from "@/api/admin/grade-lock.api";

export const useGradeLockSetting = (schoolYearId: string) => {
  return useQuery({
    queryKey: ["gradeLock", "setting", schoolYearId],
    queryFn: () => gradeLockApi.getSetting(schoolYearId),
    enabled: !!schoolYearId,
  });
};

export const useCreateGradeLockSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: gradeLockApi.createSetting,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["gradeLock", "setting", variables.schoolYearId],
      });
    },
  });
};

export const useUpdateGradeLockSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      schoolYearId,
      lockDeadline,
    }: {
      schoolYearId: string;
      lockDeadline: string;
    }) => gradeLockApi.updateSetting(schoolYearId, lockDeadline),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["gradeLock", "setting", variables.schoolYearId],
      });
    },
  });
};

export const useGradeLocks = () => {
  return useQuery({
    queryKey: ["gradeLock", "classes"],
    queryFn: gradeLockApi.getLocks,
  });
};

export const useUnlockOverride = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      reason,
    }: {
      classId: string;
      reason: string;
    }) => gradeLockApi.unlockOverride(classId, reason),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradeLock"] });
    },
  });
};