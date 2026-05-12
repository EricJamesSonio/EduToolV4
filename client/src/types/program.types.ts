// Program Types
// Type definitions for program related components and APIs

export type ProgramType =
  | 'elementary'
  | 'junior-high'
  | 'senior-high'
  | 'senior_high'
  | 'college'
  | 'vocational'
  | 'special'
  | 'stem'
  | 'arts'
  | 'sports'
  | 'other'
  | 'daycare'
  | 'preschool'
  | 'kindergarten';

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
