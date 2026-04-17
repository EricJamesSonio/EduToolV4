// ===== File: frontend/src/api/educator/grading-scheme.api.ts =====

import client from '@/api/client'
import type {
  GradingScheme,
  CreateGradingSchemeDto,
  UpdateGradingSchemeDto,
} from '@/types/admin/grading-scheme.types'

export const educatorGradingSchemeApi = {
  getForClass: async (classId: string): Promise<GradingScheme | null> => {
    try {
      const res = await client.get<GradingScheme>(
        `/grading-schemes/class/${classId}`
      )
      return res.data
    } catch (error: any) {
      if (error?.response?.status === 404) return null
      throw error
    }
  },

  /**
   * Create a grading scheme for a class
   */
  create: async (
    data: CreateGradingSchemeDto
  ): Promise<GradingScheme> => {
    const res = await client.post<GradingScheme>(
      `/grading-schemes`,
      data
    )
    return res.data
  },

  /**
   * Update an existing grading scheme
   */
  update: async (
    id: string,
    data: UpdateGradingSchemeDto
  ): Promise<GradingScheme> => {
    const res = await client.patch<GradingScheme>(
      `/grading-schemes/${id}`,
      data
    )
    return res.data
  },

  /**
   * Apply template to a single class (admin only)
   */
  applyTemplateToClass: async (data: {
    classId: string
    templateId: string
    name?: string
  }): Promise<GradingScheme> => {
    const res = await client.post<GradingScheme>(
      `/grading-schemes/apply-to-class`,
      data
    )
    return res.data
  },

  /**
   * Apply template to all classes in a program (admin only)
   */
  applyTemplateToProgram: async (data: {
    programId: string
    templateId: string
  }): Promise<{
    applied: number
    skipped: number
    total: number
  }> => {
    const res = await client.post<{
      applied: number
      skipped: number
      total: number
    }>(`/grading-schemes/apply-to-program`, data)

    return res.data
  },
}