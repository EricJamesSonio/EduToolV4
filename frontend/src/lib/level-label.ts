import type { ProgramType } from "@/types/admin/program.types";

const YEAR_ORDINALS = ["1st", "2nd", "3rd", "4th", "5th"];

export function getLevelLabel(type: ProgramType, n: number): string {
  switch (type) {
    case "daycare": return `Daycare ${n}`;
    case "kinder": return `Kinder ${n}`;
    case "elementary": return `Grade ${n}`;
    case "jhs": return `Grade ${n + 6}`;
    case "shs": return `Grade ${n + 10}`;
    case "college": {
      const ordinal = YEAR_ORDINALS[n - 1] ?? `${n}th`;
      return `${ordinal} Year`;
    }
    case "custom":
    default:
      return `${n}`;
  }
}

export function extractLevelNumber(type: ProgramType, name: string): number {
  const match = name.match(/\d+/);
  const raw = match ? parseInt(match[0], 10) : 1;
  switch (type) {
    case "jhs": return Math.max(1, raw - 6);
    case "shs": return Math.max(1, raw - 10);
    default: return Math.max(1, raw);
  }
}

export function getLevelBounds(type: ProgramType): { min: number; max: number } {
  switch (type) {
    case "elementary": return { min: 1, max: 12 };
    case "jhs": return { min: 1, max: 4 };
    case "shs": return { min: 1, max: 2 };
    case "college": return { min: 1, max: 5 };
    case "daycare":
    case "kinder": return { min: 1, max: 3 };
    default: return { min: 1, max: 20 };
  }
}