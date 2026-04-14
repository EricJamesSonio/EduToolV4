import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

import { gradeLockApi } from "@/api/admin/grade-lock.api"
import type {
  GradeLock,
  GradeLockSetting,
  GradeLockResponse,
  AutoLockResponse,
} from "@/types/admin/grade-lock.types"

import { toast } from "sonner"

// ─────────────────────────────────────────────
// QUERY KEYS (important cleanup)
// ─────────────────────────────────────────────

const gradeLockKeys = {
  all: ["gradeLock"] as const,
  settings: () => [...gradeLockKeys.all, "settings"] as const,
  classes: () => [...gradeLockKeys.all, "classes"] as const,
}

//
// ─── SETTINGS ─────────────────────────────────
//

export const useGradeLockSettings = () => {
  return useQuery<GradeLockSetting[]>({
    queryKey: gradeLockKeys.settings(),
    queryFn: gradeLockApi.getSettings,
  })
}

export const useCreateGradeLockSetting = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: gradeLockApi.createSetting,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gradeLockKeys.settings() })
      toast.success("Setting created successfully")
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create setting")
    },
  })
}

export const useUpdateGradeLockSetting = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: any
    }) => gradeLockApi.updateSetting(id, data),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gradeLockKeys.settings() })
      toast.success("Setting updated successfully")
    },

    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update setting")
    },
  })
}

//
// ─── CLASS LOCKS ─────────────────────────────
//

export const useGradeLocks = (schoolYearId?: string) => {
  return useQuery<GradeLock[]>({
    queryKey: [...gradeLockKeys.classes(), schoolYearId],

    // ✅ FIX: wrap it so ONLY schoolYearId is passed
    queryFn: () =>
      gradeLockApi.getLocks({
        schoolYearId,
      }),

    enabled: !!schoolYearId, // optional but recommended
  })
}

export const useLockClass = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({
      classId,
      reason,
    }: {
      classId: string
      reason?: string
    }) => gradeLockApi.lockClass(classId, reason),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gradeLockKeys.classes() })
      toast.success("Class locked successfully")
    },

    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to lock class")
    },
  })
}

export const useUnlockClass = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({
      classId,
      reason,
    }: {
      classId: string
      reason: string
    }) => gradeLockApi.unlockClass(classId, reason),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gradeLockKeys.classes() })
      toast.success("Class unlocked successfully")
    },

    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to unlock class")
    },
  })
}

export const useOverrideLock = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({
      classId,
      reason,
    }: {
      classId: string
      reason: string
    }) => gradeLockApi.overrideLock(classId, reason),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: gradeLockKeys.classes() })
      toast.success("Lock overridden successfully")
    },

    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to override lock")
    },
  })
}

//
// ─── AUTO LOCK ───────────────────────────────
//

export const useAutoLockExpiredClasses = () => {
  const qc = useQueryClient()

  return useMutation<AutoLockResponse, unknown, void>({
    mutationFn: gradeLockApi.autoLock,

    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: gradeLockKeys.classes() })
      toast.success(`Auto-locked ${data.lockedCount} classes`)
    },

    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Auto-lock failed")
    },
  })
}