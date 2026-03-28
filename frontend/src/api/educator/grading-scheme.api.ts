import client from '@/api/client'
import type {
  GradingScheme,
  GradingSchemeComponent,
  GradingSchemeComponentType,
} from '@/types/admin/grading-scheme.types'

// ── Component DTOs ────────────────────────────────────────────────────────────

export interface CreateGradingSchemeComponentRequest {
  name:        string
  type:        GradingSchemeComponentType
  weight:      number
  maxScore?:   number | null
  isOptional?: boolean
}

export interface UpdateGradingSchemeComponentRequest {
  name?:       string
  type?:       GradingSchemeComponentType
  weight?:     number
  maxScore?:   number | null
  isOptional?: boolean
}

// ── Scheme DTOs ───────────────────────────────────────────────────────────────

export interface CreateGradingSchemeRequest {
  name:       string
  classId?:   string
  components: CreateGradingSchemeComponentRequest[]
}

export interface UpdateGradingSchemeRequest {
  name?:       string
  components?: UpdateGradingSchemeComponentRequest[]
}

export interface GetGradingSchemesQuery {
  classId?:   string
  isDefault?: boolean
}

// ── API ───────────────────────────────────────────────────────────────────────

export const educatorGradingSchemeApi = {
  getAll: async (query?: GetGradingSchemesQuery): Promise<GradingScheme[]> => {
    const res = await client.get<GradingScheme[]>('/educator/grading-schemes', { params: query })
    return res.data
  },

  getOne: async (id: string): Promise<GradingScheme> => {
    const res = await client.get<GradingScheme>(`/educator/grading-schemes/${id}`)
    return res.data
  },

  create: async (data: CreateGradingSchemeRequest): Promise<GradingScheme> => {
    const res = await client.post<GradingScheme>('/educator/grading-schemes', data)
    return res.data
  },

  update: async (id: string, data: UpdateGradingSchemeRequest): Promise<GradingScheme> => {
    const res = await client.patch<GradingScheme>(`/educator/grading-schemes/${id}`, data)
    return res.data
  },

  delete: async (id: string): Promise<{ success: true }> => {
    const res = await client.delete<{ success: true }>(`/educator/grading-schemes/${id}`)
    return res.data
  },

  assignToClass: async (id: string, classId: string): Promise<GradingScheme> => {
    const res = await client.patch<GradingScheme>(
      `/educator/grading-schemes/${id}/assign`,
      { classId },
    )
    return res.data
  },

  // ── Components ──────────────────────────────────────────────────────────────

  addComponent: async (
    schemeId: string,
    data: CreateGradingSchemeComponentRequest,
  ): Promise<GradingSchemeComponent> => {
    const res = await client.post<GradingSchemeComponent>(
      `/educator/grading-schemes/${schemeId}/components`,
      data,
    )
    return res.data
  },

  updateComponent: async (
    schemeId:    string,
    componentId: string,
    data:        UpdateGradingSchemeComponentRequest,
  ): Promise<GradingSchemeComponent> => {
    const res = await client.patch<GradingSchemeComponent>(
      `/educator/grading-schemes/${schemeId}/components/${componentId}`,
      data,
    )
    return res.data
  },

  deleteComponent: async (
    schemeId:    string,
    componentId: string,
  ): Promise<{ success: true }> => {
    const res = await client.delete<{ success: true }>(
      `/educator/grading-schemes/${schemeId}/components/${componentId}`,
    )
    return res.data
  },
}