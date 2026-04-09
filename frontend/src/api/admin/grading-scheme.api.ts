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

export const adminGradingSchemeApi = {
  // Get grading scheme for a specific class
  getByClass: async (classId: string): Promise<GradingScheme | null> => {
    const res = await client.get<ApiResponse<GradingScheme | null>>(
      `/grading-schemes/class/${classId}`
    )
    return res.data.data
  },

  // Create new grading scheme for a class
  create: async (data: CreateGradingSchemeDto): Promise<GradingScheme> => {
    const res = await client.post<ApiResponse<GradingScheme>>(
      `/grading-schemes`,
      data
    )
    return res.data.data
  },

  // Update grading scheme
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

  // Apply template to single class
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

  // Apply template to all classes in a program (bulk operation)
  applyToProgram: async (payload: {
    programId: string
    templateId: string
    overwriteExisting?: boolean
  }): Promise<{ success: boolean; appliedCount: number }> => {
    const res = await client.post<
      ApiResponse<{ success: boolean; appliedCount: number }>
    >(`/grading-schemes/apply-to-program`, payload)
    return res.data.data
  },
}