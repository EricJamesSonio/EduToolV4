// filepath: app/admin/sections/_utils/section.utils.ts

import type { Level } from "@/types/admin/level.types";
import type { Program } from "@/types/admin/program.types";

export type EnrichedLevel = Level & { programName: string };

export function enrichLevels(levels: Level[], programs: Program[]): EnrichedLevel[] {
  const programMap = Object.fromEntries(programs.map((p) => [p.id, p.name]));
  return levels.map((l) => ({
    ...l,
    programName: programMap[l.program_id] ?? "Unknown Program",
  }));
}

export function groupLevelsByProgram(
  levels: EnrichedLevel[]
): { programName: string; levels: EnrichedLevel[] }[] {
  const map = new Map<string, EnrichedLevel[]>();
  for (const level of levels) {
    const key = level.programName;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(level);
  }
  return Array.from(map.entries()).map(([programName, levels]) => ({
    programName,
    levels,
  }));
}

export function buildLevelLabel(level: EnrichedLevel): string {
  return level.programName
    ? `${level.name} — ${level.programName}`
    : level.name;
}