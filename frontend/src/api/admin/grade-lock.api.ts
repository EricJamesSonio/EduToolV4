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
  lockType: 'hard' | 'soft' | 'flexible'
  lock_deadline?: string
  deadlineDays?: number
  allowOverride: boolean
  is_default?: boolean
}

export const gradeLockApi = {
  // ─── Settings ─────────────────────────────

  getSettings: async (): Promise<GradeLockSetting[]> => {
    const res = await client.get<GradeLockSetting[]>("/grade-lock/settings")
    return res.data
  },

  createSetting: async (
    data: CreateGradeLockSettingRequest
  ): Promise<GradeLockSetting> => {
    const res = await client.post<GradeLockSetting>(
      "/grade-lock/settings",
      data
    )
    return res.data
  },

  updateSetting: async (
    id: string,
    data: Partial<CreateGradeLockSettingRequest>
  ): Promise<GradeLockSetting> => {
    const res = await client.put<GradeLockSetting>(
      `/grade-lock/settings/${id}`,
      data
    )
    return res.data
  },

  // ─── Class Locks ──────────────────────────

  getLocks: async (): Promise<GradeLock[]> => {
    const res = await client.get<GradeLock[]>("/grade-lock/classes")
    return res.data
  },

  lockClass: async (classId: string, reason?: string): Promise<GradeLockResponse> => {
    const res = await client.post<GradeLockResponse>(
      `/grade-lock/${classId}/lock`,
      { reason }
    )
    return res.data
  },

  unlockClass: async (
    classId: string,
    reason: string
  ): Promise<GradeLockResponse> => {
    const res = await client.post<GradeLockResponse>(
      `/grade-lock/${classId}/unlock`,
      { reason }
    )
    return res.data
  },

  overrideLock: async (
    classId: string,
    reason: string
  ): Promise<GradeLockResponse> => {
    const res = await client.post<GradeLockResponse>(
      `/grade-lock/${classId}/override`,
      { reason }
    )
    return res.data
  },

  // ─── Auto Lock ────────────────────────────

  autoLock: async (): Promise<AutoLockResponse> => {
    const res = await client.post<AutoLockResponse>(
      "/grade-lock/auto-lock"
    )
    return res.data
  },
}