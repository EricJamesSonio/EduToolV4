// frontend/src/api/admin/organization.api.ts
import client from "@/api/client"
import type { Organization } from "@/types/admin/organization.types"
import type { AxiosError } from "axios"

export interface CreateOrganizationRequest {
  name:        string
  description?: string
}

export interface UpdateOrganizationRequest {
  name?:           string
  description?:    string
  emailExtension?: string | null
}

export interface GradingScaleRangePayload {
  label:      string
  minScore:   number
  maxScore:   number
  gradeValue: string
}

export interface GradingScalePayload {
  presetKey: string
  name:      string
  ranges:    GradingScaleRangePayload[]
}

export interface SeedOrganizationRequest {
  schoolYearId:      string
  programs:          string[]
  courses?:          string[]
  strands?:          string[]
  excludedLevels?:   string[]
  excludedSubjects?: string[]
  /** Custom level names per program. Key = programKey, value = ordered level name array.
   *  e.g. { college: ['1st Year', '2nd Year', '3rd Year'], shs: ['Grade 11', 'Grade 12'] } */
  levelConfigs?:     Record<string, string[]>
  /** One grading scale per program key, e.g. { elementary: { ... }, college: { ... } } */
  gradingScales?:    Record<string, GradingScalePayload>
}

export const organizationApi = {
  getOrg: async (): Promise<Organization | null> => {
    try {
      const res = await client.get<{ success: boolean; data: Organization }>("/organization")
      return res.data.data
    } catch (err) {
      if ((err as AxiosError)?.response?.status === 404) return null
      throw err
    }
  },

  createOrg: async (data: CreateOrganizationRequest): Promise<Organization> => {
    const res = await client.post<{ success: boolean; data: Organization }>("/organization", data)
    return res.data.data
  },

  updateOrg: async (data: UpdateOrganizationRequest): Promise<Organization> => {
    const res = await client.patch<{ success: boolean; data: Organization }>("/organization", data)
    return res.data.data
  },

  seedOrg: async (data: SeedOrganizationRequest): Promise<void> => {
    await client.post("/organization/seed", data)
  },
}