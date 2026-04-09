import type { ProgramType } from "@/types/admin/program.types";
import { PROGRAM_TYPE_LABELS, PROGRAM_TYPE_VALUES } from "@/types/admin/program.types";

export { PROGRAM_TYPE_LABELS };

export const PROGRAM_TYPE_OPTIONS: { value: ProgramType; label: string }[] = 
  PROGRAM_TYPE_VALUES.map((value) => ({
    value,
    label: PROGRAM_TYPE_LABELS[value],
  }));