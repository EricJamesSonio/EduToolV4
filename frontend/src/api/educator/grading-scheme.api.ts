import client from '@/api/client'
import type {
  GradingScheme,
  CreateGradingSchemeDto,
  UpdateGradingSchemeDto,
} from '@/types/admin/grading-scheme.types'

export const educatorGradingSchemeApi = {
  getDefault: async (): Promise<GradingScheme> => {
    const res = await client.get<GradingScheme>('/grading-schemes/default')
    return res.data
  },

  getAll: async (): Promise<GradingScheme[]> => {
    const res = await client.get<{ success: boolean; data: GradingScheme[] }>('/grading-schemes')
    return res.data.data
  },

  create: async (data: CreateGradingSchemeDto): Promise<GradingScheme> => {
    const res = await client.post<GradingScheme>('/grading-schemes', data)
    return res.data
  },

  update: async (id: string, data: UpdateGradingSchemeDto): Promise<GradingScheme> => {
    const res = await client.patch<GradingScheme>(`/grading-schemes/${id}`, data)
    return res.data
  },

  getForClass: async (classId: string): Promise<GradingScheme> => {
    const res = await client.get<GradingScheme>(`/grading-schemes/class/${classId}`)
    return res.data
  },

  saveForClass: async (classId: string, data: UpdateGradingSchemeDto): Promise<GradingScheme> => {
    const res = await client.patch<GradingScheme>(`/grading-schemes/class/${classId}`, data)
    return res.data
  },
}