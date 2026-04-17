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
  getForClass: async (classId: string): Promise<GradingScheme | null> => {
    const res = await client.get(`/grading-schemes/class/${classId}`)
    return res.data
  },

  create: async (data: CreateGradingSchemeDto): Promise<GradingScheme> => {
    const res = await client.post(`/grading-schemes`, data)
    return res.data
  },

  update: async (id: string, data: UpdateGradingSchemeDto): Promise<GradingScheme> => {
    const res = await client.patch(`/grading-schemes/${id}`, data)
    return res.data
  },

  applyTemplateToClass: async (data: {
    classId: string
    templateId: string
    name?: string
  }) => {
    const res = await client.post(`/grading-schemes/apply-to-class`, data)
    return res.data
  },

  applyTemplateToProgram: async (data: {
    programId: string
    templateId: string
  }) => {
    const res = await client.post(`/grading-schemes/apply-to-program`, data)
    return res.data
  },
}