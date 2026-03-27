import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { gradeLockApi } from "@/api/admin/grade-lock.api"; // API functions
import type { GradeLockSetting, GradeLock } from "@/types/admin/grade-lock.types"; // types

// Hook to fetch grade lock setting for a school year
export const useGradeLockSetting = (schoolYearId: string): UseQueryResult<GradeLockSetting, unknown> => {
  return useQuery<GradeLockSetting>({
    queryKey: ["gradeLock", "setting", schoolYearId],
    queryFn: () => gradeLockApi.getSetting(schoolYearId),
    enabled: !!schoolYearId,
  });
};

// Hook to create a grade lock setting
export const useCreateGradeLockSetting = (): UseMutationResult<
  GradeLockSetting, 
  unknown, 
  { schoolYearId: string; lockDeadline: string }
> => {
  const queryClient = useQueryClient();

  return useMutation<GradeLockSetting, unknown, { schoolYearId: string; lockDeadline: string }>({
    mutationFn: gradeLockApi.createSetting,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["gradeLock", "setting", variables.schoolYearId],
      });
    },
  });
};

// Hook to update a grade lock setting
export const useUpdateGradeLockSetting = (): UseMutationResult<
  GradeLockSetting,
  unknown,
  { schoolYearId: string; lockDeadline: string }
> => {
  const queryClient = useQueryClient();

  return useMutation<GradeLockSetting, unknown, { schoolYearId: string; lockDeadline: string }>({
    mutationFn: ({ schoolYearId, lockDeadline }) =>
      gradeLockApi.updateSetting(schoolYearId, lockDeadline),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["gradeLock", "setting", variables.schoolYearId],
      });
    },
  });
};

// Hook to fetch all grade locks
export const useGradeLocks = (): UseQueryResult<GradeLock[], unknown> => {
  return useQuery<GradeLock[]>({
    queryKey: ["gradeLock", "classes"],
    queryFn: gradeLockApi.getLocks,
  });
};

export const useUnlockOverride = (): UseMutationResult<
  { success: true }, // ✅ return type matches API
  unknown,
  { classId: string; reason: string }
> => {
  const queryClient = useQueryClient();

  return useMutation<{ success: true }, unknown, { classId: string; reason: string }>({
    mutationFn: ({ classId, reason }) => gradeLockApi.unlockOverride(classId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradeLock"] });
    },
  });
};