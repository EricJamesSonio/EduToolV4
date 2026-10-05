"use client";

import { useQuery } from "@tanstack/react-query";
import { programApi } from "@/api/admin/program.api";
import type { Program } from "@/types/admin/program.types";

/**
 * Programs for a school year, WITH their live courses/strands.
 *
 * Shared by the scope picker and the hierarchy page so both read one cache
 * entry. The key is intentionally the same one `SubjectHierarchyFilter` used
 * inline before it was extracted here — switching to the generic `usePrograms`
 * hook would key on `queryKeys.admin.programs.list(...)`, i.e. a DIFFERENT
 * entry, and the page would then fire a duplicate request for data the filter
 * already has cached.
 */
export function useHierarchyPrograms(schoolYearId?: string) {
  return useQuery({
    queryKey: ["admin", "programs", schoolYearId ?? "none"],
    queryFn: () => programApi.getAll(schoolYearId as string),
    enabled: !!schoolYearId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
}

export type { Program };