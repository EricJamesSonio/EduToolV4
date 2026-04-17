import client from '@/api/client'
import type {
  GradingScheme,
  CreateGradingSchemeDto,
  UpdateGradingSchemeDto,
} from '@/types/admin/grading-scheme.types'

// 👇 reusable unwrap helper
const unwrap = <T>(res: any): T => res.data?.data ?? res.data

export const educatorGradingSchemeApi = {
  getForClass: async (classId: string): Promise<GradingScheme | null> => {
    try {
      const res = await client.get(`/grading-schemes/class/${classId}`)
      return unwrap<GradingScheme>(res)
    } catch (error: any) {
      if (error?.response?.status === 404) return null
      throw error
    }
  },

  create: async (data: CreateGradingSchemeDto): Promise<GradingScheme> => {
    const res = await client.post(`/grading-schemes`, data)
    return unwrap<GradingScheme>(res)
  },

  update: async (
    id: string,
    data: UpdateGradingSchemeDto
  ): Promise<GradingScheme> => {
    const res = await client.patch(`/grading-schemes/${id}`, data)
    return unwrap<GradingScheme>(res)
  },

  applyTemplateToClass: async (data: {
    classId: string
    templateId: string
    name?: string
  }): Promise<GradingScheme> => {
    const res = await client.post(`/grading-schemes/apply-to-class`, data)
    return unwrap<GradingScheme>(res)
  },

  applyTemplateToProgram: async (data: {
    programId: string
    templateId: string
  }): Promise<{
    applied: number
    skipped: number
    total: number
  }> => {
    const res = await client.post(`/grading-schemes/apply-to-program`, data)
    return unwrap(res)
  },
}