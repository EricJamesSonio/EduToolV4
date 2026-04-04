import client from '@/api/client'
import type {
  GradingScheme,
  CreateGradingSchemeDto,
  UpdateGradingSchemeDto,
} from '@/types/admin/grading-scheme.types'

interface ApiResponse<T> {
  success: boolean
  data: T
}

export const educatorGradingSchemeApi = {
  getDefault: async (): Promise<GradingScheme> => {
    const res = await client.get<ApiResponse<GradingScheme>>('/grading-schemes/default')
    return res.data.data
  },

  getAll: async (): Promise<GradingScheme[]> => {
    const res = await client.get<ApiResponse<GradingScheme[]>>('/grading-schemes')
    return res.data.data
  },

  create: async (data: CreateGradingSchemeDto): Promise<GradingScheme> => {
    const res = await client.post<ApiResponse<GradingScheme>>('/grading-schemes', data)
    return res.data.data
  },

  update: async (id: string, data: UpdateGradingSchemeDto): Promise<GradingScheme> => {
    const res = await client.patch<ApiResponse<GradingScheme>>(`/grading-schemes/${id}`, data)
    return res.data.data
  },

  getForClass: async (classId: string): Promise<GradingScheme> => {
    const res = await client.get<ApiResponse<GradingScheme>>(`/grading-schemes/class/${classId}`)
    return res.data.data
  },

  saveForClass: async (classId: string, data: UpdateGradingSchemeDto): Promise<GradingScheme> => {
    const res = await client.patch<ApiResponse<GradingScheme>>(`/grading-schemes/class/${classId}`, data)
    return res.data.data
  },
}