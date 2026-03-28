import client from '@/api/client'
import type {
  GradingScheme,
  UpdateDefaultGradingSchemeDto,
} from '@/types/admin/grading-scheme.types'

export const adminGradingSchemeApi = {
  // GET /grading-schemes/default
  getDefault: async (): Promise<GradingScheme> => {
    const res = await client.get<GradingScheme>('/grading-schemes/default')
    return res.data
  },

  // PATCH /grading-schemes/default  (admin only)
  updateDefault: async (data: UpdateDefaultGradingSchemeDto): Promise<GradingScheme> => {
    const res = await client.patch<GradingScheme>('/grading-schemes/default', data)
    return res.data
  },
}