// Program Types
// Type definitions for program related components and APIs

export interface Program {
  id: string;
  name: string;
  type: string;
  schoolYearId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProgramDto {
  name: string;
  type: string;
  schoolYearId: string;
}

export interface UpdateProgramDto {
  name?: string;
  type?: string;
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
