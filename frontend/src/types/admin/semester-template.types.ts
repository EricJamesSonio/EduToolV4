// REPLACE the current ProgramType:
export type ProgramType = 'daycare' | 'kinder' | 'elementary' | 'jhs' | 'shs' | 'college' | 'custom'

export interface TermTemplateItem {
  id?: string
  name: string
  order_index: number
}

export interface SemesterTemplateItem {
  id?: string
  name: string
  order_index: number
  terms: TermTemplateItem[]
}

export interface SemesterTemplate {
  id: string
  org_id: string
  program_type: ProgramType
  name: string
  semesters: SemesterTemplateItem[]
}

export interface TemplateAssignment {
  id: string
  program_id: string
  template_id: string
  template: Pick<SemesterTemplate, 'id' | 'name' | 'program_type'>
  program?: { id: string; name: string; type: string; school_year_id: string } // ADD THIS
}

export interface SemesterTemplateCreateDto {
  name: string
  programType: ProgramType
  semesters: { name: string; orderIndex: number; terms: { name: string; orderIndex: number }[] }[]
}

export interface SemesterTemplateUpdateDto {
  name?: string
  semesters?: {
    name: string
    orderIndex: number
    terms: { name: string; orderIndex: number }[]
  }[]
}

export interface AssignTemplateDto {
  programId: string
  templateId: string
}