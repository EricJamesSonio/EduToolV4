// ===== File: frontend/src/api/admin/grading-scheme.api.ts =====

import client from '@/api/client'

import type {
  GradingScheme,
  CreateGradingSchemeDto,
  UpdateGradingSchemeDto,
  GradingSchemeTemplate,
  ApplyToProgramPayload,
} from '@/types/admin/grading-scheme.types'

interface ApiResponse<T> {
  success: boolean
  data: T
}

export const adminGradingSchemeApi = {
  // ========================================
  // CLASS-BASED SCHEME
  // ========================================

  // GET /grading-schemes/class/:classId
  getByClass: async (classId: string): Promise<GradingScheme | null> => {
    const res = await client.get<ApiResponse<GradingScheme | null>>(
      `/grading-schemes/class/${classId}`
    )
    return res.data.data
  },

  // POST /grading-schemes
  create: async (data: CreateGradingSchemeDto): Promise<GradingScheme> => {
    const res = await client.post<ApiResponse<GradingScheme>>(
      `/grading-schemes`,
      data
    )
    return res.data.data
  },

  // PATCH /grading-schemes/:id
  update: async (
    schemeId: string,
    data: UpdateGradingSchemeDto
  ): Promise<GradingScheme> => {
    const res = await client.patch<ApiResponse<GradingScheme>>(
      `/grading-schemes/${schemeId}`,
      data
    )
    return res.data.data
  },

  // ========================================
  // TEMPLATE
  // ========================================

  // ⚠️ Only include this IF you have a template controller
  getTemplates: async (
    programType?: string
  ): Promise<GradingSchemeTemplate[]> => {
    const res = await client.get<ApiResponse<GradingSchemeTemplate[]>>(
      `/grading-scheme-templates`,
      {
        params: { programType },
      }
    )
    return res.data.data
  },

  // ========================================
  // APPLY TEMPLATE
  // ========================================

  // POST /grading-schemes/apply-to-class
  applyToClass: async (payload: {
    classId: string
    templateId: string
    name?: string
  }): Promise<GradingScheme> => {
    const res = await client.post<ApiResponse<GradingScheme>>(
      `/grading-schemes/apply-to-class`,
      payload
    )
    return res.data.data
  },

  // POST /grading-schemes/apply-to-program
  applyToProgram: async (
    payload: ApplyToProgramPayload
  ): Promise<{ success: boolean }> => {
    const res = await client.post<ApiResponse<{ success: boolean }>>(
      `/grading-schemes/apply-to-program`,
      payload
    )
    return res.data.data
  },
}