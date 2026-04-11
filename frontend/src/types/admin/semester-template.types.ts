import type { ProgramType } from "./program.types";

export type { ProgramType };

export interface TermTemplateItem {
  id?: string;
  name: string;
  order_index: number;
}

export interface SemesterTemplateItem {
  id?: string;
  name: string;
  order_index: number;
  terms: TermTemplateItem[];
}

export interface SemesterTemplate {
  id: string;
  org_id: string;
  program_type: ProgramType;
  name: string;
  semesters: SemesterTemplateItem[];
}

export interface TermDate {
  id: string;
  term_id: string;
  assignment_id: string;
  start_date: string;
  end_date: string;
}

export interface TemplateAssignment {
  id: string;
  program_id: string;
  template_id: string;
  template: Pick<SemesterTemplate, 'id' | 'name' | 'program_type'>;
  program?: {
    id: string;
    name: string;
    type: string;
    school_year_id: string;
  };
  termDates: TermDate[]; // merged here ✅
}

export interface SemesterTemplateCreateDto {
  name: string;
  programType: ProgramType;
  semesters: {
    name: string;
    orderIndex: number;
    terms: {
      name: string;
      orderIndex: number;
    }[];
  }[];
}

export interface SemesterTemplateUpdateDto {
  name?: string;
  semesters?: {
    name: string;
    orderIndex: number;
    terms: {
      name: string;
      orderIndex: number;
    }[];
  }[];
}

export interface AssignTemplateDto {
  programId: string;
  templateId: string;
  termDates?: {
    termId: string;
    startDate: string;
    endDate: string;
  }[];
}