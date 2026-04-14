// ===== File: frontend/src/api/admin/grade-lock.api.ts =====

import client from "@/api/client"
import type { GradeLock, GradeLockSetting, GradeLockResponse } from "@/types/admin/grade-lock.types"

export interface CreateGradeLockSettingRequest {
  schoolYearId: string
  lockDeadline: string
}

export const gradeLockApi = {
  /**
   * Get lock deadline for a school year
   * GET /grade-lock/settings?schoolYearId={id}
   */
  getSetting: async (schoolYearId: string): Promise<GradeLockSetting | null> => {
    try {
      const res = await client.get<GradeLockSetting>("/grade-lock/settings", {
        params: { schoolYearId },
      })
      return res.data
    } catch (error: any) {
      // If no deadline set, backend returns 404 or empty response
      if (error?.response?.status === 404) {
        return null
      }
      throw error
    }
  },

  /**
   * Create/set lock deadline for a school year
   * POST /grade-lock/settings
   */
  createSetting: async (data: CreateGradeLockSettingRequest): Promise<GradeLockSetting> => {
    const res = await client.post<GradeLockSetting>("/grade-lock/settings", data)
    return res.data
  },

  /**
   * Update lock deadline for a school year
   * PATCH /grade-lock/settings (using POST since backend uses upsert)
   */
  updateSetting: async (
    schoolYearId: string,
    lockDeadline: string
  ): Promise<GradeLockSetting> => {
    const res = await client.post<GradeLockSetting>("/grade-lock/settings", {
      schoolYearId,
      lockDeadline,
    })
    return res.data
  },

  /**
   * Get all class locks for organization
   * GET /grade-lock/classes
   */
  getLocks: async (): Promise<GradeLock[]> => {
    const res = await client.get<GradeLock[]>("/grade-lock/classes")
    return res.data
  },

  /**
   * Educator: Lock their class (before deadline)
   * POST /grade-lock/:classId/lock
   */
  lockClass: async (classId: string): Promise<GradeLockResponse> => {
    const res = await client.post<GradeLockResponse>(`/grade-lock/${classId}/lock`)
    return res.data
  },

  /**
   * Educator/Admin: Unlock a class
   * - Educators: only before deadline
   * - Admins: anytime (override)
   * POST /grade-lock/:classId/unlock
   */
  unlockClass: async (classId: string): Promise<GradeLockResponse> => {
    const res = await client.post<GradeLockResponse>(`/grade-lock/${classId}/unlock`)
    return res.data
  },

  /**
   * Admin: Unlock with override (alias for unlockClass)
   * POST /grade-lock/:classId/unlock
   */
  unlockOverride: async (classId: string): Promise<GradeLockResponse> => {
    const res = await client.post<GradeLockResponse>(`/grade-lock/${classId}/unlock`)
    return res.data
  },

  /**
   * Auto-lock expired classes (optional, can be called by scheduler)
   * POST /grade-lock/auto-lock
   */
  autoLock: async (): Promise<{ success: boolean; lockedCount: number }> => {
    const res = await client.post<{ success: boolean; lockedCount: number }>(
      "/grade-lock/auto-lock"
    )
    return res.data
  },
}