// ===== File: frontend/src/hooks/admin/useGradeLocks.ts =====

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from "@tanstack/react-query"
import { gradeLockApi } from "@/api/admin/grade-lock.api"
import type { GradeLockSetting, GradeLock, GradeLockResponse } from "@/types/admin/grade-lock.types"
import { toast } from "sonner"

/**
 * GET lock deadline for a school year
 */
export const useGradeLockSetting = (
  schoolYearId: string
): UseQueryResult<GradeLockSetting | null, unknown> => {
  return useQuery<GradeLockSetting | null>({
    queryKey: ["gradeLock", "setting", schoolYearId],
    queryFn: () => gradeLockApi.getSetting(schoolYearId),
    enabled: !!schoolYearId,
  })
}

/**
 * CREATE/SET lock deadline
 */
export const useCreateGradeLockSetting = (): UseMutationResult<
  GradeLockSetting,
  unknown,
  { schoolYearId: string; lockDeadline: string }
> => {
  const queryClient = useQueryClient()

  return useMutation<
    GradeLockSetting,
    unknown,
    { schoolYearId: string; lockDeadline: string }
  >({
    mutationFn: (data) => gradeLockApi.createSetting(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["gradeLock", "setting", variables.schoolYearId],
      })
      toast.success("Lock deadline set successfully")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to set lock deadline")
    },
  })
}

/**
 * UPDATE lock deadline
 */
export const useUpdateGradeLockSetting = (): UseMutationResult<
  GradeLockSetting,
  unknown,
  { schoolYearId: string; lockDeadline: string }
> => {
  const queryClient = useQueryClient()

  return useMutation<
    GradeLockSetting,
    unknown,
    { schoolYearId: string; lockDeadline: string }
  >({
    mutationFn: ({ schoolYearId, lockDeadline }) =>
      gradeLockApi.updateSetting(schoolYearId, lockDeadline),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["gradeLock", "setting", variables.schoolYearId],
      })
      toast.success("Lock deadline updated successfully")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update lock deadline")
    },
  })
}

/**
 * GET all class locks (admin dashboard)
 */
export const useGradeLocks = (): UseQueryResult<GradeLock[], unknown> => {
  return useQuery<GradeLock[]>({
    queryKey: ["gradeLock", "classes"],
    queryFn: gradeLockApi.getLocks,
  })
}

/**
 * EDUCATOR: Lock their class (before deadline)
 */
export const useLockClass = (): UseMutationResult<
  GradeLockResponse,
  unknown,
  { classId: string }
> => {
  const queryClient = useQueryClient()

  return useMutation<GradeLockResponse, unknown, { classId: string }>({
    mutationFn: ({ classId }) => gradeLockApi.lockClass(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradeLock"] })
      toast.success("Class locked successfully")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to lock class")
    },
  })
}

/**
 * EDUCATOR/ADMIN: Unlock a class
 * - Educators: only before deadline
 * - Admins: anytime (override)
 */
export const useUnlockClass = (): UseMutationResult<
  GradeLockResponse,
  unknown,
  { classId: string }
> => {
  const queryClient = useQueryClient()

  return useMutation<GradeLockResponse, unknown, { classId: string }>({
    mutationFn: ({ classId }) => gradeLockApi.unlockClass(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradeLock"] })
      toast.success("Class unlocked successfully")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to unlock class")
    },
  })
}

/**
 * ADMIN: Unlock with override (after deadline)
 * Alias for unlockClass - backend handles role-based logic
 */
export const useUnlockOverride = (): UseMutationResult<
  GradeLockResponse,
  unknown,
  { classId: string }
> => {
  const queryClient = useQueryClient()

  return useMutation<GradeLockResponse, unknown, { classId: string }>({
    mutationFn: ({ classId }) => gradeLockApi.unlockOverride(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gradeLock"] })
      toast.success("Class unlocked (admin override)")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to unlock class")
    },
  })
}

/**
 * AUTO-LOCK: Manually trigger auto-lock for expired classes
 * (Optional - mainly for testing or manual triggering)
 */
export const useAutoLockExpiredClasses = (): UseMutationResult<
  { success: boolean; lockedCount: number },
  unknown,
  void
> => {
  const queryClient = useQueryClient()

  return useMutation<{ success: boolean; lockedCount: number }, unknown, void>({
    mutationFn: () => gradeLockApi.autoLock(),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["gradeLock"] })
      toast.success(`Auto-locked ${data.lockedCount} classes`)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to auto-lock classes")
    },
  })
}