import type { ProgramType } from "@/types/admin/program.types";
import { getLevelLabel, getLevelBounds } from "@/lib/level-label";

type CountConfig = {
  label: string;
  default: number;
  min: number;
  max: number;
  preview: (n: number) => string;
};

export function getCountConfig(type: ProgramType | string): CountConfig {
  const t = type as ProgramType;
  const { min, max } = getLevelBounds(t);

  const labelText: Record<string, string> = {
    elementary: "Number of grades",
    jhs: "Number of grades",
    shs: "Number of grades",
    college: "Number of years",
    daycare: "Number of levels",
    kinder: "Number of levels",
  };

  const defaults: Record<string, number> = {
    elementary: 6,
    jhs: 4,
    shs: 2,
    college: 4,
    daycare: 2,
    kinder: 2,
  };

  return {
    label: labelText[t] ?? "Number of levels",
    default: defaults[t] ?? Math.min(3, max),
    min,
    max,
    preview: (n) =>
      n <= 1 ? getLevelLabel(t, 1) : `${getLevelLabel(t, 1)} → ${getLevelLabel(t, n)}`,
  };
}