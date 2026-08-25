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
  college:    "bg-[#BFDBFE] text-[#0B1E3A] border-[#93C5FD]",
  shs:        "bg-[#DDD6FE] text-[#0B1E3A] border-[#C4B5FD]",
  jhs:        "bg-[#FDE68A] text-[#0B1E3A] border-[#FCD34D]",
  elementary: "bg-[#98FB98] text-[#0B1E3A] border-[#86EFAC]",
  kinder:     "bg-[#FBCFE8] text-[#0B1E3A] border-[#F9A8D4]",
  daycare:    "bg-[#FED7AA] text-[#0B1E3A] border-[#FDBA74]",
  custom:     "bg-[#E2E8F0] text-[#0B1E3A] border-[#CBD5E1]",
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