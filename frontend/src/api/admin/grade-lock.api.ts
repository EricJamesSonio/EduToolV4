import client from "@/api/client"
import type {
  GradeLock,
  GradeLockSetting,
  GradeLockResponse,
  AutoLockResponse,
} from "@/types/admin/grade-lock.types"

export interface CreateGradeLockSettingRequest {
  name: string
  description?: string
  lockType: "hard" | "soft" | "flexible"
  lock_deadline?: string
  deadlineDays?: number
  allowOverride: boolean
  is_default?: boolean
}

type ApiResponse<T> = {
  success: boolean
  data: T
}

export const gradeLockApi = {
  // ─── Settings ─────────────────────────────

  getSettings: async (): Promise<GradeLockSetting[]> => {
    const res = await client.get<ApiResponse<GradeLockSetting[]>>(
      "/grade-lock/settings"
    )
    return res.data.data ?? []
  },

  getSetting: async (
    schoolYearId: string
  ): Promise<GradeLockSetting | null> => {
    try {
      const res = await client.get<ApiResponse<GradeLockSetting>>(
        "/grade-lock/settings",
        { params: { schoolYearId } }
      )
      return res.data.data ?? null
    } catch (err: any) {
      if (err?.response?.status === 404) return null
      throw err
    }
  },

  createSetting: async (
    data: CreateGradeLockSettingRequest
  ): Promise<GradeLockSetting> => {
    const res = await client.post<ApiResponse<GradeLockSetting>>(
      "/grade-lock/settings",
      data
    )
    return res.data.data
  },

  updateSetting: async (
    id: string,
    data: Partial<CreateGradeLockSettingRequest>
  ): Promise<GradeLockSetting> => {
    const res = await client.put<ApiResponse<GradeLockSetting>>(
      `/grade-lock/settings/${id}`,
      data
    )
    return res.data.data
  },

  // ─── Class Locks ──────────────────────────

  getLocks: async (
    schoolYearId?: string
  ): Promise<GradeLock[]> => {
    const res = await client.get<ApiResponse<GradeLock[]>>(
      "/grade-lock/classes",
      { params: schoolYearId ? { schoolYearId } : {} }
    )
    return res.data.data ?? []
  },

  lockClass: async (
    classId: string,
    reason?: string
  ): Promise<GradeLockResponse> => {
    const res = await client.post<ApiResponse<GradeLockResponse>>(
      `/grade-lock/${classId}/lock`,
      { reason }
    )
    return res.data.data
  },

  unlockClass: async (
    classId: string,
    reason: string
  ): Promise<GradeLockResponse> => {
    const res = await client.post<ApiResponse<GradeLockResponse>>(
      `/grade-lock/${classId}/unlock`,
      { reason }
    )
    return res.data.data
  },

  overrideLock: async (
    classId: string,
    reason: string
  ): Promise<GradeLockResponse> => {
    const res = await client.post<ApiResponse<GradeLockResponse>>(
      `/grade-lock/${classId}/override`,
      { reason }
    )
    return res.data.data
  },

  // ─── Auto Lock ────────────────────────────

  autoLock: async (): Promise<AutoLockResponse> => {
    const res = await client.post<ApiResponse<AutoLockResponse>>(
      "/grade-lock/auto-lock"
    )
    return res.data.data
  },
}