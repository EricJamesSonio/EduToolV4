// components/assign-row/types.ts
import type { SemesterTemplate, TemplateAssignment } from "@/types/admin/semester-template.types"

export interface Program {
  id: string
  name: string
  type: string
  school_year_id: string
}

export interface ProgramWithAssignment extends Program {
  semesterAssignment: TemplateAssignment | null
}

export interface AssignRowProps {
  program: ProgramWithAssignment
  templates: SemesterTemplate[]
  schoolYearStart: string | null
  schoolYearEnd: string | null
}

export interface TermWithSemester {
  id: string
  name: string
  semesterName: string
}

export type TermDatesMap = Record<string, { startDate: string; endDate: string }>