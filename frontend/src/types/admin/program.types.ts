/* ========================= PROGRAM TYPE (SOURCE OF TRUTH) ========================= */
export type ProgramType = 
  | "daycare" 
  | "kinder" 
  | "elementary" 
  | "jhs" 
  | "shs" 
  | "college" 
  | "custom";

export const PROGRAM_TYPE_VALUES: readonly ProgramType[] = [
  "daycare",
  "kinder",
  "elementary",
  "jhs",
  "shs",
  "college",
  "custom",
];

export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  daycare:    "Daycare / Pre-School",
  kinder:     "Kindergarten",
  elementary: "Elementary",
  jhs:        "Junior High School",
  shs:        "Senior High School",
  college:    "College",
  custom:     "Custom",
};

export const PROGRAM_TYPE_COLORS: Record<ProgramType, string> = {
  college:    "bg-blue-500/10 text-blue-600 border-blue-200",
  shs:        "bg-violet-500/10 text-violet-600 border-violet-200",
  jhs:        "bg-amber-500/10 text-amber-600 border-amber-200",
  elementary: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  kinder:     "bg-pink-500/10 text-pink-600 border-pink-200",
  daycare:    "bg-orange-500/10 text-orange-600 border-orange-200",
  custom:     "bg-slate-500/10 text-slate-600 border-slate-200",
};

/* ========================= OTHER PROGRAM TYPES ========================= */
export interface CourseSnapshot {
  id:   string;
  name: string;
  code: string | null;
}

export interface StrandSnapshot {
  id:   string;
  name: string;
}

export interface Program {
  id:           string;
  orgId:        string;
  schoolYearId: string;
  school_year_id: string;
  name:         string;
  type:         ProgramType;
  courses:      CourseSnapshot[];
  strands:      StrandSnapshot[];
}