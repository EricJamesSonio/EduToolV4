import { useMemo } from "react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { levelApi } from "@/api/admin/level.api";
import { programApi } from "@/api/admin/program.api";
import { enrichLevels, groupLevelsByProgram } from "@/components/admin/section/utils/section.utils";
import type { EnrichedLevel } from "@/components/admin/section/utils/section.utils";

interface UseEnrichedLevelsReturn {
  levels: EnrichedLevel[];
  grouped: { programName: string; levels: EnrichedLevel[] }[];
  levelMap: Record<string, { name: string; programName: string; programId: string }>;
  isLoading: boolean;
}

export function useEnrichedLevels(schoolYearId?: string | null): UseEnrichedLevelsReturn {
  const enabled = !!schoolYearId;

  const { data: rawLevels = [], isLoading: levelsLoading } = useAsyncQuery(
    schoolYearId ? queryKeys.admin.levels.enriched({ schoolYearId }) : queryKeys.admin.levels.all,
    () =>
      schoolYearId
        ? levelApi.getBySchoolYear(schoolYearId)
        : levelApi.getAll(),
    {
      enabled,
    },
  );

  const { data: programs = [], isLoading: programsLoading } = useAsyncQuery(
    schoolYearId ? [...queryKeys.admin.programs.list({ schoolYearId })] as const : queryKeys.admin.programs.all,
    () => {
      if (!schoolYearId) return Promise.resolve([]);
      return programApi.getAll({ schoolYearId } as any);
    },
    {
      enabled,
    },
  );

  const levels = useMemo(() => enrichLevels(rawLevels, programs), [rawLevels, programs]);
  const grouped = useMemo(() => groupLevelsByProgram(levels), [levels]);
  const levelMap = useMemo(
    () =>
      Object.fromEntries(
        levels.map((l) => [l.id, { name: l.name, programName: l.programName, programId: l.program_id }]),
      ),
    [levels],
  );

  return { levels, grouped, levelMap, isLoading: levelsLoading || programsLoading };
}