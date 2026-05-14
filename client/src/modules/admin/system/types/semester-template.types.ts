// client/src/modules/admin/system/types/semester-template.types.ts

// ── Program type — mirrors backend ProgramType enum exactly ───────────────────

export type ProgramType =
  | 'elementary'
  | 'high_school'
  | 'senior_high'
  | 'college'
  | 'custom';

export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  elementary:  'Elementary',
  high_school: 'High School',
  senior_high: 'Senior High School',
  college:     'College',
  custom:      'Custom',
};

// ── Term (inside a template semester item) ─────────────────────────────────────

export interface SemesterTemplateTerm {
  id: string;
  name: string;
  order_index: number;
  org_id: string;
  semester_id: string;
}

// ── Template semester item ─────────────────────────────────────────────────────

export interface SemesterTemplateItem {
  id: string;
  name: string;
  order_index: number;
  template_id: string;
  org_id: string;
  terms: SemesterTemplateTerm[];
}

// ── Semester template ──────────────────────────────────────────────────────────

export interface SemesterTemplate {
  id: string;
  org_id: string;
  name: string;
  program_type: ProgramType;
  semesters: SemesterTemplateItem[];
  created_at: string;
  updated_at: string;
}

// ── Assignment term date ───────────────────────────────────────────────────────

export interface AssignmentTermDate {
  id: string;
  assignment_id: string;
  term_id: string;
  org_id: string;
  start_date: string;
  end_date: string;
}

// ── Program (slim shape returned by assignment includes) ───────────────────────

export interface AssignedProgram {
  id: string;
  name: string;
  type: ProgramType;
  school_year_id: string;
}

// ── Assignment ─────────────────────────────────────────────────────────────────

export interface SemesterTemplateAssignment {
  id: string;
  org_id: string;
  program_id: string;
  template_id: string;
  program: AssignedProgram;
  template: SemesterTemplate;
  termDates: AssignmentTermDate[];
}

// ── DTOs (client → API) ────────────────────────────────────────────────────────

export interface CreateSemesterTemplateTermDto {
  name: string;
  orderIndex: number;
}

export interface CreateSemesterTemplateItemDto {
  name: string;
  orderIndex: number;
  terms: CreateSemesterTemplateTermDto[];
}

export interface CreateSemesterTemplateDto {
  name: string;
  programType: ProgramType;
  semesters: CreateSemesterTemplateItemDto[];
}

export interface UpdateSemesterTemplateDto {
  name?: string;
  semesters?: CreateSemesterTemplateItemDto[];
}

export interface AssignSemesterTemplateDto {
  programId: string;
  templateId: string;
}

export interface TermDateEntry {
  termId: string;
  startDate: string;
  endDate: string;
}

export interface SaveTermDatesDto {
  termDates: TermDateEntry[];
}

// ── UI helper ─────────────────────────────────────────────────────────────────

export type TermDateMap = Record<string, { startDate: string; endDate: string }>;