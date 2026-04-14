// frontend\src\hooks\admin\useEnrollmentDrilldown.ts
"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

export interface DrilldownState {
  programId:  string | null;
  courseId:   string | null;
  strandId:   string | null;
  levelId:    string | null;
}

export function useEnrollmentDrilldown() {
  const router     = useRouter();
  const pathname   = usePathname();
  const params     = useSearchParams();

  const state: DrilldownState = {
    programId: params.get("programId"),
    courseId:  params.get("courseId"),
    strandId:  params.get("strandId"),
    levelId:   params.get("levelId"),
  };

  const push = useCallback(
    (next: Partial<DrilldownState>) => {
      const url = new URL(window.location.href);
      // Always preserve tab
      const tab = url.searchParams.get("tab") ?? "programs";
      url.searchParams.set("tab", tab);

      // Apply new state — null means remove the param
      (Object.entries(next) as [keyof DrilldownState, string | null][]).forEach(
        ([key, val]) => {
          if (val === null || val === undefined) {
            url.searchParams.delete(key);
          } else {
            url.searchParams.set(key, val);
          }
        },
      );

      router.replace(url.pathname + url.search);
    },
    [router, pathname],
  );

  const selectProgram = useCallback(
    (programId: string) =>
      push({ programId, courseId: null, strandId: null, levelId: null }),
    [push],
  );

  const selectCourse = useCallback(
    (courseId: string) =>
      push({ courseId, strandId: null, levelId: null }),
    [push],
  );

  const selectStrand = useCallback(
    (strandId: string) =>
      push({ strandId, courseId: null, levelId: null }),
    [push],
  );

  const selectLevel = useCallback(
    (levelId: string) => push({ levelId }),
    [push],
  );

  const backToPrograms = useCallback(
    () => push({ programId: null, courseId: null, strandId: null, levelId: null }),
    [push],
  );

  const backToCourse = useCallback(
    () => push({ levelId: null }),
    [push],
  );

  const backToStrand = useCallback(
    () => push({ levelId: null }),
    [push],
  );

  return {
    state,
    selectProgram,
    selectCourse,
    selectStrand,
    selectLevel,
    backToPrograms,
    backToCourse,
    backToStrand,
  };
}