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
  name:        string
  isDefault?:  boolean
  components:  CreateGradingSchemeComponentRequest[]
}

export interface UpdateGradingSchemeRequest {
  name?:       string
  isDefault?:  boolean
  components?: UpdateGradingSchemeComponentRequest[]
}

export interface GetGradingSchemesQuery {
  classId?:    string
  educatorId?: string
  isDefault?:  boolean
}

// ── API ───────────────────────────────────────────────────────────────────────

export const gradingSchemeApi = {
  getAll: async (query?: GetGradingSchemesQuery): Promise<GradingScheme[]> => {
    const res = await client.get<GradingScheme[]>('/grading-schemes', { params: query })
    return res.data
  },

  getOne: async (id: string): Promise<GradingScheme> => {
    const res = await client.get<GradingScheme>(`/grading-schemes/${id}`)
    return res.data
  },

  create: async (data: CreateGradingSchemeRequest): Promise<GradingScheme> => {
    const res = await client.post<GradingScheme>('/grading-schemes', data)
    return res.data
  },

  update: async (id: string, data: UpdateGradingSchemeRequest): Promise<GradingScheme> => {
    const res = await client.patch<GradingScheme>(`/grading-schemes/${id}`, data)
    return res.data
  },

  delete: async (id: string): Promise<{ success: true }> => {
    const res = await client.delete<{ success: true }>(`/grading-schemes/${id}`)
    return res.data
  },

  setDefault: async (id: string): Promise<GradingScheme> => {
    const res = await client.patch<GradingScheme>(`/grading-schemes/${id}/set-default`)
    return res.data
  },

  lock: async (id: string): Promise<{ success: true }> => {
    const res = await client.patch<{ success: true }>(`/grading-schemes/${id}/lock`)
    return res.data
  },

  unlock: async (id: string): Promise<{ success: true }> => {
    const res = await client.patch<{ success: true }>(`/grading-schemes/${id}/unlock`)
    return res.data
  },

  // ── Components ──────────────────────────────────────────────────────────────

  addComponent: async (
    schemeId: string,
    data: CreateGradingSchemeComponentRequest,
  ): Promise<GradingSchemeComponent> => {
    const res = await client.post<GradingSchemeComponent>(
      `/grading-schemes/${schemeId}/components`,
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
      `/grading-schemes/${schemeId}/components/${componentId}`,
      data,
    )
    return res.data
  },

  deleteComponent: async (
    schemeId:    string,
    componentId: string,
  ): Promise<{ success: true }> => {
    const res = await client.delete<{ success: true }>(
      `/grading-schemes/${schemeId}/components/${componentId}`,
    )
    return res.data
  },
}