export type ProgramType = "built_in" | "custom";

export interface Course {
  id: string;
  name: string;
  description: string | null;
  maxYearLevel: number;
}

export interface Program {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  type: ProgramType;
  courses: Course[];
  createdAt: string;
  updatedAt: string;
}