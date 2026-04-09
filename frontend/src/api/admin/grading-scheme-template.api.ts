// ===== File: frontend\src\api\admin\grading-scheme-template.api.ts =====
import client from '@/api/client'
import type {
  GradingSchemeTemplate,
  CreateGradingSchemeTemplateDto,
  ApplyTemplateToClassDto,
} from '@/types/admin/grading-scheme-template.types'

interface ApiResponse<T> {
  success: boolean
  data: T
}

export const adminGradingSchemeTemplateApi = {
  // Get all templates, optionally filtered by program type
  getAll: async (programType?: string): Promise<GradingSchemeTemplate[]> => {
    const res = await client.get<ApiResponse<GradingSchemeTemplate[]>>(
      `/grading-scheme-templates`,
      {
        params: programType ? { programType } : undefined,
      }
    )
    return res.data.data
  },

  // Get single template by ID
  getById: async (templateId: string): Promise<GradingSchemeTemplate> => {
    const res = await client.get<ApiResponse<GradingSchemeTemplate>>(
      `/grading-scheme-templates/${templateId}`
    )
    return res.data.data
  },

  // Create new template
  create: async (
    data: CreateGradingSchemeTemplateDto
  ): Promise<GradingSchemeTemplate> => {
    const res = await client.post<ApiResponse<GradingSchemeTemplate>>(
      `/grading-scheme-templates`,
      data
    )
    return res.data.data
  },

  // Update template
  update: async (
    templateId: string,
    data: Partial<CreateGradingSchemeTemplateDto>
  ): Promise<GradingSchemeTemplate> => {
    const res = await client.patch<ApiResponse<GradingSchemeTemplate>>(
      `/grading-scheme-templates/${templateId}`,
      data
    )
    return res.data.data
  },

  // Delete template
  delete: async (templateId: string): Promise<{ success: boolean }> => {
    const res = await client.delete<ApiResponse<{ success: boolean }>>(
      `/grading-scheme-templates/${templateId}`
    )
    return res.data.data
  },

  // Apply template to single class
  applyToClass: async (
    payload: ApplyTemplateToClassDto
  ): Promise<{ success: boolean }> => {
    const res = await client.post<ApiResponse<{ success: boolean }>>(
      `/grading-scheme-templates/apply/class`,
      payload
    )
    return res.data.data
  },

  // Apply template to all classes in a program (bulk)
  applyToProgram: async (payload: {
    programId: string
    templateId: string
    overwriteExisting?: boolean
  }): Promise<{ success: boolean; appliedCount: number }> => {
    const res = await client.post<
      ApiResponse<{ success: boolean; appliedCount: number }>
    >(`/grading-scheme-templates/apply/program`, payload)
    return res.data.data
  },
}