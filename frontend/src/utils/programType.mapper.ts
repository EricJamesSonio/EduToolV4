// src/utils/programType.mapper.ts

import type { ProgramType as UIProgramType } from "@/types/admin/program.types";
import type { ProgramType as ApiProgramType } from "@/api/admin/program.api";

export function mapToApiProgramType(type: UIProgramType): ApiProgramType {
  switch (type) {
    case "jhs":
      return "high_school";
    case "shs":
      return "senior_high";
    case "elementary":
    case "college":
    case "custom":
      return type;
    case "daycare":
    case "kinder":
      return "elementary"; // decide based on your logic
    default:
      return "custom";
  }
}