"use client";

import { useQuery } from "@tanstack/react-query";
import { levelApi } from "@/api/admin/level.api";
import type { Level } from "@/types/admin/level.types";

export function useSchoolYearLevels(schoolYearId: string) {
  return useQuery<Level[]>({
    queryKey: ["school-year-levels", schoolYearId],
    queryFn: async () => {
      const res = await levelApi.getBySchoolYear(schoolYearId);
      return res.data ?? res; // handles both API shapes safely
    },
    staleTime: 1000 * 60 * 5,
  });
}