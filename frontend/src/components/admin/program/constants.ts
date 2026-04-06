// app/admin/programs/_components/constants.ts

import type { ProgramType } from "@/api/admin/program.api";

export const PROGRAM_TYPE_LABELS: Record<ProgramType, string> = {
  elementary: "Elementary",
  high_school: "High School",
  senior_high: "Senior High",
  college: "College",
  custom: "Custom",
};

export const PROGRAM_TYPE_OPTIONS: { value: ProgramType; label: string }[] = [
  { value: "elementary", label: "Elementary" },
  { value: "high_school", label: "Junior High School" },
  { value: "senior_high", label: "Senior High School" },
  { value: "college", label: "College" },
  { value: "custom", label: "Custom" },
];