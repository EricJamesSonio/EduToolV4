import client from "@/api/client"
import type { Organization } from "@/types/admin/organization.types"
import type { AxiosError }   from "axios"

export interface CreateOrganizationRequest {
  name:         string
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
  schoolYearId:          string
  programs:              string[]
  courses?:              string[]
  strands?:              string[]
  excludedLevels?:       string[]
  excludedSubjects?:     string[]                        // plain names — for minors/GE
  excludedLevelSubjects?: Record<string, string[]>       // levelName → plain subject names
  levelConfigs?:         Record<string, string[]>
  gradingScales?:        Record<string, GradingScalePayload>
  sectionConfigs?:       Record<string, { name: string; capacity: number }[]>
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