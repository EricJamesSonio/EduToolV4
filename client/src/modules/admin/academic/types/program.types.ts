// client/src/modules/admin/academic/types/program.types.ts
// Program Types — source of truth: backend ProgramType enum

export type ProgramType =
  | 'elementary'
  | 'high_school'
  | 'senior_high'
  | 'college'
  | 'custom';

export interface Program {
  id: string;
  name: string;
  type: ProgramType;
  schoolYearId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProgramDto {
  name: string;
  type: ProgramType;
  schoolYearId: string;
}

export interface UpdateProgramDto {
  name?: string;
  type?: ProgramType;
}

export interface ProgramWithAssignments extends Program {
  levels?: Array<{
    id: string;
    name: string;
    order: number;
  }>;
  courses?: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  strands?: Array<{
    id: string;
    name: string;
    description?: string;
  }>;
}

export interface ProgramWithStats extends Program {
  levels: Array<{
    id: string;
    name: string;
  }>;
  courses: Array<{
    id: string;
    name: string;
    code?: string;
  }>;
  strands: Array<{
    id: string;
    name: string;
  }>;
}

export interface ProgramStats {
  levelsCount: number;
  coursesCount: number;
  strandsCount: number;
  hasLevels: boolean;
  hasCourses: boolean;
  hasStrands: boolean;
}