// ===== File: frontend/src/api/admin/grade-lock.api.ts =====

import client from "@/api/client"
import type {
  GradeLock,
  GradeLockSetting,
  GradeLockResponse,
} from "@/types/admin/grade-lock.types"

export interface CreateGradeLockSettingRequest {
  schoolYearId: string
  lockDeadline: string
}

export const gradeLockApi = {
  /**
   * Get lock deadline for a school year
   * GET /grade-lock/settings?schoolYearId={id}
   */
  getSetting: async (
    schoolYearId: string
  ): Promise<GradeLockSetting | null> => {
    try {
      const res = await client.get<{
        success: boolean
        data: GradeLockSetting
      }>("/grade-lock/settings", {
        params: { schoolYearId },
      })

      return res.data.data
    } catch (error: any) {
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
  createSetting: async (
    data: CreateGradeLockSettingRequest
  ): Promise<GradeLockSetting> => {
    const res = await client.post<{
      success: boolean
      data: GradeLockSetting
    }>("/grade-lock/settings", data)

    return res.data.data
  },

  /**
   * Update lock deadline for a school year
   * (backend uses upsert via POST)
   */
  updateSetting: async (
    schoolYearId: string,
    lockDeadline: string
  ): Promise<GradeLockSetting> => {
    const res = await client.post<{
      success: boolean
      data: GradeLockSetting
    }>("/grade-lock/settings", {
      schoolYearId,
      lockDeadline,
    })

    return res.data.data
  },

  /**
   * Get all class locks for organization
   * GET /grade-lock/classes
   */
  getLocks: async (): Promise<GradeLock[]> => {
    const res = await client.get<{
      success: boolean
      data: GradeLock[]
    }>("/grade-lock/classes")

    return res.data.data
  },

  /**
   * Educator: Lock their class (before deadline)
   * POST /grade-lock/:classId/lock
   */
  lockClass: async (classId: string): Promise<GradeLockResponse> => {
    const res = await client.post<{
      success: boolean
      data: GradeLockResponse
    }>(`/grade-lock/${classId}/lock`)

    return res.data.data
  },

  /**
   * Educator/Admin: Unlock a class
   * - Educators: only before deadline
   * - Admins: anytime (override)
   */
  unlockClass: async (classId: string): Promise<GradeLockResponse> => {
    const res = await client.post<{
      success: boolean
      data: GradeLockResponse
    }>(`/grade-lock/${classId}/unlock`)

    return res.data.data
  },

  /**
   * Admin: Unlock with override (alias for unlockClass)
   */
  unlockOverride: async (classId: string): Promise<GradeLockResponse> => {
    const res = await client.post<{
      success: boolean
      data: GradeLockResponse
    }>(`/grade-lock/${classId}/unlock`)

    return res.data.data
  },

  /**
   * Auto-lock expired classes
   * NOTE: This one might NOT be wrapped the same way depending on backend
   */
  autoLock: async (): Promise<{ success: boolean; lockedCount: number }> => {
    const res = await client.post<{
      success: boolean
      lockedCount: number
    }>("/grade-lock/auto-lock")

    return res.data
  },
}