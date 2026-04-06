// frontend/src/hooks/admin/useEnrichedLevels.ts
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { levelApi } from "@/api/admin/level.api";
import { programApi } from "@/api/admin/program.api";
import { enrichLevels, groupLevelsByProgram } from "@/components/admin/section/utils/section.utils";
import type { EnrichedLevel } from "@/components/admin/section/utils/section.utils";

interface UseEnrichedLevelsReturn {
  levels:    EnrichedLevel[];
  grouped:   { programName: string; levels: EnrichedLevel[] }[];
  levelMap:  Record<string, { name: string; programName: string }>;
  isLoading: boolean;
}

export function useEnrichedLevels(schoolYearId?: string | null): UseEnrichedLevelsReturn {
  const enabled = schoolYearId !== null;

  const { data: rawLevels = [], isLoading: levelsLoading } = useQuery({
    queryKey: ["admin", "levels", schoolYearId ?? "all"],
    queryFn:  () => schoolYearId
      ? levelApi.getBySchoolYear(schoolYearId)
      : levelApi.getAll(),
    enabled,
  });

  const { data: programs = [], isLoading: programsLoading } = useQuery({
    queryKey: ["admin", "programs", schoolYearId ?? "all"],
    queryFn:  () => programApi.getAll(schoolYearId ?? undefined),
    enabled,
  });

  const levels   = useMemo(() => enrichLevels(rawLevels, programs), [rawLevels, programs]);
  const grouped  = useMemo(() => groupLevelsByProgram(levels), [levels]);
  const levelMap = useMemo(
    () => Object.fromEntries(levels.map((l) => [l.id, { name: l.name, programName: l.programName }])),
    [levels]
  );

  return { levels, grouped, levelMap, isLoading: levelsLoading || programsLoading };
}