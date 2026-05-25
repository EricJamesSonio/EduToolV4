import { UseQueryResult } from "@tanstack/react-query";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { programApi } from "@/api/admin/program.api";
import type { Program } from "@/types/admin/program.types";

// Get programs for a school year
// API signature: getAll(schoolYearId: string)
export const usePrograms = (schoolYearId?: string): UseQueryResult<Program[], Error> => {
  return useAsyncQuery<Program[]>(
    schoolYearId ? [...queryKeys.admin.programs.list({ schoolYearId })] as const : queryKeys.admin.programs.list(),
    () => {
      if (!schoolYearId) return Promise.resolve([]);
      return programApi.getAll(schoolYearId);
    },
    {
      enabled: !!schoolYearId,
    },
  );
};