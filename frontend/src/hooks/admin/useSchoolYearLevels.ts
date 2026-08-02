"use client";

import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { levelApi } from "@/api/admin/level.api";
import { queryKeys } from "@/hooks/queryKeys.factory";
import type { Level } from "@/types/admin/level.types";

export function useSchoolYearLevels(schoolYearId: string) {
  return useAsyncQuery<Level[]>(
    queryKeys.admin.levels.list({ schoolYearId }),
    async () => {
      return levelApi.getBySchoolYear(schoolYearId);
    },
    { enabled: !!schoolYearId },
  );
}
