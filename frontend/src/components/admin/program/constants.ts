import type { ProgramType } from "@/types/admin/program.types";

export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  daycare:    "Daycare / Pre-School",
  kinder:     "Kindergarten",
  elementary: "Elementary",
  jhs:        "Junior High School",
  shs:        "Senior High School",
  college:    "College",
  custom:     "Custom",
};

export const PROGRAM_TYPE_OPTIONS: { value: ProgramType; label: string }[] = [
  { value: "daycare",    label: "Daycare / Pre-School" },
  { value: "kinder",     label: "Kindergarten" },
  { value: "elementary", label: "Elementary" },
  { value: "jhs",        label: "Junior High School" },
  { value: "shs",        label: "Senior High School" },
  { value: "college",    label: "College" },
  { value: "custom",     label: "Custom" },
];