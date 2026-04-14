// frontend\src\hooks\admin\useEnrollmentDrilldown.ts
"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import type { ProgramDetailTab } from "@/components/admin/school-years/constants";

export interface DrilldownState {
  programId:  string | null;
  programTab: ProgramDetailTab | null;
  courseId:   string | null;
  strandId:   string | null;
  levelId:    string | null;
}

export function useEnrollmentDrilldown() {
  const router = useRouter();
  const params = useSearchParams();

  const state: DrilldownState = {
    programId:  params.get("programId"),
    programTab: params.get("programTab") as ProgramDetailTab | null,
    courseId:   params.get("courseId"),
    strandId:   params.get("strandId"),
    levelId:    params.get("levelId"),
  };

  const push = useCallback(
    (next: Partial<DrilldownState>) => {
      const url = new URL(window.location.href);

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
    [router],
  );

  const selectProgram = useCallback(
    (programId: string) =>
      push({ programId, programTab: null, courseId: null, strandId: null, levelId: null }),
    [push],
  );

const selectProgramTab = useCallback(
  (tab: ProgramDetailTab) =>
    push({ programTab: tab, courseId: null, strandId: null, levelId: null }),
  [push],
);

const selectCourse = useCallback(
  (courseId: string) => push({ programTab: "enrollment", courseId, strandId: null, levelId: null }),
  [push],
);

const selectStrand = useCallback(
  (strandId: string) => push({ programTab: "enrollment", strandId, courseId: null, levelId: null }),
  [push],
);

 const selectLevel = useCallback(
  (levelId: string) => push({ programTab: "enrollment", levelId }),
  [push],
);

  // Goes back to program list
  const backToPrograms = useCallback(
    () => push({ programId: null, programTab: null, courseId: null, strandId: null, levelId: null }),
    [push],
  );

  // Goes back to course list (clears level only)
  const backToCourseList = useCallback(
    () => push({ levelId: null }),
    [push],
  );

  // Goes back to strand list (clears level only)
  const backToStrandList = useCallback(
    () => push({ levelId: null }),
    [push],
  );

  return {
    state,
    selectProgram,
    selectProgramTab,
    selectCourse,
    selectStrand,
    selectLevel,
    backToPrograms,
    backToCourseList,
    backToStrandList,
  };
}