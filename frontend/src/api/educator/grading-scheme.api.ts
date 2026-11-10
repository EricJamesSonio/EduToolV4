// frontend/src/api/educator/grading-scheme.api.ts

import client from '@/api/client'
import type {
  GradingScheme,
  CreateGradingSchemeDto,
  UpdateGradingSchemeDto,
} from '@/types/admin/grading-scheme.types'
import type {
  GradingSchemeTemplate,
  CreateGradingSchemeTemplateDto,
} from '@/types/admin/grading-scheme-template.types'
import type { GradingScale } from '@/types/admin/grading-scale.types'

const unwrap = <T>(res: any): T => res.data?.data ?? res.data

export interface ClassGradingSchemeStatus {
  allowEducatorOverride: boolean
  hasScheme: boolean
  lockedBySemester: boolean
  semesterName: string | null
  semesterStartDate: string | null
  lockReason: 'educator_override_disabled' | 'semester_started' | null
  canEdit: boolean
}

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

  /**
   * GET /grading-schemes/class/:classId/status
   * Whether the current user may edit this class's scheme, and why not.
   */
  getClassStatus: async (classId: string): Promise<ClassGradingSchemeStatus> => {
    const res = await client.get(`/grading-schemes/class/${classId}/status`)
    return unwrap<ClassGradingSchemeStatus>(res)
  },

  create: async (data: CreateGradingSchemeDto): Promise<GradingScheme> => {
    const res = await client.post(`/grading-schemes`, data)
    return unwrap<GradingScheme>(res)
  },

  update: async (
    id: string,
    data: UpdateGradingSchemeDto,
  ): Promise<GradingScheme> => {
    const res = await client.patch(`/grading-schemes/${id}`, data)
    return unwrap<GradingScheme>(res)
  },

  applyTemplateToClass: async (data: {
    classId:    string
    templateId: string
    name?:      string
  }): Promise<GradingScheme> => {
    const res = await client.post(`/grading-schemes/apply-to-class`, data)
    return unwrap<GradingScheme>(res)
  },

  applyTemplateToProgram: async (data: {
    programId:  string
    templateId: string
  }): Promise<{ applied: number; skipped: number; total: number }> => {
    const res = await client.post(`/grading-schemes/apply-to-program`, data)
    return unwrap(res)
  },

  getAllowedTypes: async (classId: string): Promise<string[]> => {
    const res = await client.get(`/grading-schemes/class/${classId}/allowed-types`)
    return unwrap<string[]>(res)
  },

  /**
   * GET /grading-scales/by-class/:classId
   * Returns the grading scale applied to the class's program.
   * Returns null if no scale is configured.
   */
  getScaleForClass: async (classId: string): Promise<GradingScale | null> => {
    try {
      const res = await client.get(`/grading-scales/by-class/${classId}`)
      return unwrap<GradingScale>(res)
    } catch (error: any) {
      if (error?.response?.status === 404) return null
      throw error
    }
  },

  // ── Template Library ─────────────────────────────────────────────────────

  getTemplates: async (programType?: string): Promise<GradingSchemeTemplate[]> => {
    const res = await client.get(`/grading-scheme-templates`, {
      params: programType ? { programType } : undefined,
    })
    return unwrap<GradingSchemeTemplate[]>(res)
  },

  getTemplate: async (templateId: string): Promise<GradingSchemeTemplate> => {
    const res = await client.get(`/grading-scheme-templates/${templateId}`)
    return unwrap<GradingSchemeTemplate>(res)
  },

  createTemplate: async (data: CreateGradingSchemeTemplateDto): Promise<GradingSchemeTemplate> => {
    const res = await client.post(`/grading-scheme-templates`, data)
    return unwrap<GradingSchemeTemplate>(res)
  },

  updateTemplate: async (
    templateId: string,
    data: Partial<CreateGradingSchemeTemplateDto>,
  ): Promise<GradingSchemeTemplate> => {
    const res = await client.patch(`/grading-scheme-templates/${templateId}`, data)
    return unwrap<GradingSchemeTemplate>(res)
  },

  deleteTemplate: async (templateId: string): Promise<void> => {
    await client.delete(`/grading-scheme-templates/${templateId}`)
  },
}