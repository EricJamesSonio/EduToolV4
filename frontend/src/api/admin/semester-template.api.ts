import clientApi from '@/api/client'
import type {
  SemesterTemplate,
  TemplateAssignment,
  SemesterTemplateCreateDto,
  SemesterTemplateUpdateDto,
  AssignTemplateDto,
} from '@/types/admin/semester-template.types'

interface Envelope<T> {
  success: boolean
  data: T
}

export const semesterTemplateApi = {
  // Get all templates (no school-year filter)
  getAll: async (): Promise<SemesterTemplate[]> => {
    const res = await clientApi.get<Envelope<SemesterTemplate[]>>('/semester-templates')
    return res.data.data ?? []
  },

  getById: async (id: string): Promise<SemesterTemplate> => {
    const res = await clientApi.get<Envelope<SemesterTemplate>>(`/semester-templates/${id}`)
    return res.data.data
  },

  create: async (dto: SemesterTemplateCreateDto): Promise<SemesterTemplate> => {
    const res = await clientApi.post<Envelope<SemesterTemplate>>('/semester-templates', dto)
    return res.data.data
  },

  update: async (id: string, dto: SemesterTemplateUpdateDto): Promise<SemesterTemplate> => {
    const res = await clientApi.patch<Envelope<SemesterTemplate>>(`/semester-templates/${id}`, dto)
    return res.data.data
  },

  delete: async (id: string): Promise<void> => {
    await clientApi.delete(`/semester-templates/${id}`)
  },

  // Get all assignments (no school-year filter)
  getAssignments: async (): Promise<TemplateAssignment[]> => {
    const res = await clientApi.get<Envelope<TemplateAssignment[]>>('/semester-templates/assignments')
    return res.data.data ?? []
  },

  assign: async (dto: AssignTemplateDto): Promise<TemplateAssignment> => {
    const res = await clientApi.post<Envelope<TemplateAssignment>>(
      '/semester-templates/assignments',
      dto
    )
    return res.data.data
  },

  removeAssignment: async (programId: string): Promise<void> => {
    await clientApi.delete(`/semester-templates/assignments/${programId}`)
  },
}