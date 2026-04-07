

export type ProgramType =
  | "daycare"
  | "kinder"
  | "elementary"
  | "jhs"
  | "shs"
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
  schoolYearId: string; // added — schema school_year_id is now required
  name: string;
  type: ProgramType;
  courses: CourseSnapshot[];
  strands: StrandSnapshot[];
}