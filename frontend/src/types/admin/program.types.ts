export type ProgramType =
  | "elementary"
  | "high_school"
  | "senior_high"
  | "college"
  | "custom";

export interface CourseSnapshot {
  id: string;
  name: string;
  code: string | null;
}

export interface StrandSnapshot {
  id: string;
  name: string;
}

export interface Program {
  id: string;
  orgId: string;
  name: string;
  type: ProgramType;
  courses: CourseSnapshot[];
  strands: StrandSnapshot[];
}