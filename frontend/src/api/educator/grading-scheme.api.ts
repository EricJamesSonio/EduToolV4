import client from '@/api/client'
import type {
  GradingScheme,
  CreateGradingSchemeDto,
  UpdateGradingSchemeDto,
} from '@/types/admin/grading-scheme.types'

export const educatorGradingSchemeApi = {
  // GET /grading-schemes/default  (shared — accessible by all roles)
  getDefault: async (): Promise<GradingScheme> => {
    const res = await client.get<GradingScheme>('/grading-schemes/default')
    return res.data
  },

  // GET /grading-schemes  (educator's own library)
  getAll: async (): Promise<GradingScheme[]> => {
    const res = await client.get<GradingScheme[]>('/grading-schemes')
    return res.data
  },

  // POST /grading-schemes
  create: async (data: CreateGradingSchemeDto): Promise<GradingScheme> => {
    const res = await client.post<GradingScheme>('/grading-schemes', data)
    return res.data
  },

  // PATCH /grading-schemes/:id
  update: async (id: string, data: UpdateGradingSchemeDto): Promise<GradingScheme> => {
    const res = await client.patch<GradingScheme>(`/grading-schemes/${id}`, data)
    return res.data
  },
}