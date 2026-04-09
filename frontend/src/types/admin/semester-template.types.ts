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
  program_type: string
  name: string
  semesters: SemesterTemplateItem[]
}

export interface TemplateAssignment {
  id: string
  program_id: string
  template_id: string
  template: Pick<SemesterTemplate, 'id' | 'name'>
}

export interface SemesterTemplateCreateDto {
  name: string
  programType: string
  semesters: {
    name: string
    orderIndex: number
    terms: { name: string; orderIndex: number }[]
  }[]
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