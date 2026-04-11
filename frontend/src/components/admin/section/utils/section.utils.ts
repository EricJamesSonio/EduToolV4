import type { Level }   from "@/types/admin/level.types";
import type { Program, CourseSnapshot, StrandSnapshot } from "@/types/admin/program.types";

export type EnrichedLevel = Level & {
  programName: string;
  programType: string;
  courses:     CourseSnapshot[];
  strands:     StrandSnapshot[];
};

export function enrichLevels(
  levels:   Level[],
  programs: Program[]
): EnrichedLevel[] {
  const programMap = Object.fromEntries(programs.map((p) => [p.id, p]));

  return levels.map((l) => {
    const program = programMap[l.program_id];
    return {
      ...l,
      programName: program?.name     ?? "Unknown Program",
      programType: program?.type     ?? "custom",
      courses:     program?.courses  ?? [],
      strands:     program?.strands  ?? [],
    };
  });
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

export function programNeedsSubGroup(type: string): boolean {
  return type === "college" || type === "shs";
}