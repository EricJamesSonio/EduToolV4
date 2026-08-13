// frontend/src/hooks/admin/useEnrichedLevels.ts

import { useMemo } from "react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { levelApi } from "@/api/admin/level.api";
import { programApi } from "@/api/admin/program.api";

import {
  enrichLevels,
  groupLevelsByProgram,
} from "@/components/admin/section/utils/section.utils";

import type { EnrichedLevel } from "@/components/admin/section/utils/section.utils";

interface UseEnrichedLevelsReturn {
  levels: EnrichedLevel[];
  grouped: { programName: string; levels: EnrichedLevel[] }[];
  levelMap: Record<
    string,
    { name: string; programName: string; programId: string }
  >;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

export function useEnrichedLevels(
  schoolYearId?: string | null
): UseEnrichedLevelsReturn {
  const enabled = !!schoolYearId;

  // ── Levels ─────────────────────────────────────────────
  const {
    data: rawLevels = [],
    isLoading: levelsLoading,
    isError: levelsError,
    refetch: refetchLevels,
  } = useAsyncQuery(
    schoolYearId
      ? queryKeys.admin.levels.enriched({ schoolYearId })
      : queryKeys.admin.levels.all,
    () =>
      schoolYearId
        ? levelApi.getBySchoolYear(schoolYearId)
        : levelApi.getAll(),
    { enabled }
  );

  // ── Programs ───────────────────────────────────────────
  const {
    data: programs = [],
    isLoading: programsLoading,
    isError: programsError,
    refetch: refetchPrograms,
  } = useAsyncQuery(
    schoolYearId
      ? queryKeys.admin.programs.list({ schoolYearId })
      : queryKeys.admin.programs.all,
    () => (schoolYearId ? programApi.getAll(schoolYearId) : Promise.resolve([])),
    { enabled }
  );

  // ── SAFE ENRICHMENT (FIX HERE) ─────────────────────────
  const levels = useMemo(() => {
    return enrichLevels(rawLevels, programs);
  }, [rawLevels, programs]);

  const grouped = useMemo(() => {
    return groupLevelsByProgram(levels);
  }, [levels]);

  const levelMap = useMemo(() => {
    const map: Record<
      string,
      { name: string; programName: string; programId: string }
    > = {};

    for (const l of levels) {
      map[l.id] = {
        name: l.name,
        programName: l.programName ?? "Unknown Department",
        programId: l.program_id ?? "",
      };
    }

    return map;
  }, [levels]);

  return {
    levels,
    grouped,
    levelMap,
    isLoading: levelsLoading || programsLoading,
    isError: levelsError || programsError,
    refetch: () => {
      refetchLevels();
      refetchPrograms();
    },
  };
}