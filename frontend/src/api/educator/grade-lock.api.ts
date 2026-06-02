import client from "@/api/client"
import type { ClassLockInfo } from "@/types/admin/grade-lock.types"

type ApiResponse<T> = {
  success: boolean
  data: T
}

export const educatorGradeLockApi = {
  getClassLockInfo: async (classId: string): Promise<ClassLockInfo> => {
    const res = await client.get<ApiResponse<ClassLockInfo>>(
      `/grade-lock/${classId}/info`
    )
    return res.data.data
  },

  requestUnlock: async (classId: string, reason: string): Promise<{ success: boolean }> => {
    const res = await client.post<ApiResponse<{ success: boolean }>>(
      `/grade-lock/${classId}/request-unlock`,
      { reason }
    )
    return res.data.data
  },
}
