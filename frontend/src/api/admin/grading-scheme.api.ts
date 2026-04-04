import client from '@/api/client'
import type {
  GradingScheme,
  UpdateDefaultGradingSchemeDto,
} from '@/types/admin/grading-scheme.types'

interface ApiResponse<T> {
  success: boolean
  data: T
}

export const adminGradingSchemeApi = {
  getDefault: async (): Promise<GradingScheme> => {
    const res = await client.get<ApiResponse<GradingScheme>>('/grading-schemes/default')
    return res.data.data
  },

  updateDefault: async (data: UpdateDefaultGradingSchemeDto): Promise<GradingScheme> => {
    const res = await client.patch<ApiResponse<GradingScheme>>('/grading-schemes/default', data)
    return res.data.data
  },
}