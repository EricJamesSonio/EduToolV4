"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  subjectHierarchyApi,
  type HierarchyScope,
} from "@/api/admin/subject-hierarchy.api";

/**
 * Efficient hierarchy fetching:
 * - One batched backend call per scope (levels + subjects + links).
 * - Long staleTime: curriculum rarely changes; scope-keyed cache means
 *   revisiting a course/strand never refetches within the session window.
 * - `enabled` gate: no fetch until a program (or school year) is picked.
 */
export function scopeKey(scope: HierarchyScope): string {
  // levelId MUST be part of the key: omitting it makes two different level
  // selections collide in the cache, so switching level silently serves the
  // previously selected level's subjects.
  return [
    scope.schoolYearId ?? "-",
    scope.programId ?? "-",
    scope.courseId ?? "-",
    scope.strandId ?? "-",
    scope.levelId ?? "-",
  ].join("|");
}

export function useSubjectHierarchy(scope: HierarchyScope, enabled = true) {
  // A department is the minimum meaningful scope. Previously this was
  // `programId || schoolYearId`, which made a bare school year fetch every
  // department's subjects at once. Selecting the department alone is still
  // correct for departments with no course/strand dimension — callers that need
  // the stricter "course/strand chosen" rule pass `enabled` themselves (see
  // `isHierarchyScopeReady`).
  const ready = enabled && !!scope.programId;
  const query = useQuery({
    queryKey: ["admin", "subject-hierarchy", scopeKey(scope)],
    queryFn: () => subjectHierarchyApi.get(scope),
    enabled: ready,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });

  // `placeholderData: (prev) => prev` above keeps the previous scope's nodes
  // visible while a new scope loads — but React Query applies it even to a
  // DISABLED query, so a scope that just became incomplete would still render
  // the last department's subjects. Suppressing data when not ready is what
  // actually stops the stale graph; `enabled` alone is not enough.
  const data = ready ? query.data : undefined;

  const columns = useMemo(() => {
    if (!data) return [];
    // Group nodes by year rank → columns 1st → highest.
    const byRank = new Map<number, typeof data.nodes>();
    for (const n of data.nodes) {
      const list = byRank.get(n.yearRank) ?? [];
      list.push(n);
      byRank.set(n.yearRank, list);
    }
    return [...byRank.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([rank, nodes]) => ({
        rank,
        levelName: data.levels.find((l) => l.rank === rank)?.name ?? `Year ${rank}`,
        nodes: [...nodes].sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [data]);

  return { ...query, data, columns, ready };
}

/**
 * Batched per-student overlay: single statuses call for all visible node ids.
 * Cached per student + id-set so opening/closing the modal is free.
 */
export function useHierarchyStatuses(
  studentId: string | null,
  subjectIds: string[],
  enabled = true,
) {
  const sortedIds = useMemo(() => [...new Set(subjectIds)].sort(), [subjectIds]);
  return useQuery({
    queryKey: ["admin", "students", studentId, "subject-statuses", sortedIds.join(",")],
    queryFn: () => subjectHierarchyApi.statuses(studentId as string, sortedIds),
    enabled: enabled && !!studentId && sortedIds.length > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });
}
