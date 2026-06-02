import apiClient from "@/api/client"

type ApiResponse<T> = {
  success: boolean
  data: T
}

export interface ClassLockInfo {
  is_locked: boolean
  locked_at: string | null
  locked_by: string | null
  setting: {
    id: string
    name: string
    lock_deadline: string | null
    deadlineDays: number | null
    allowOverride: boolean
  } | null
  hasPendingRequest: boolean
  deadlineExpired: boolean
  deadline: string | null
}

export const studentGradeLockApi = {
  getClassLockInfo: async (classId: string): Promise<ClassLockInfo> => {
    const { data } = await apiClient.get<ApiResponse<ClassLockInfo>>(
      `/grade-lock/${classId}/info`
    )
    return data.data
  },
}
