"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAsyncQuery } from "@/hooks/hook-factory.utils";
import { queryKeys } from "@/hooks/queryKeys.factory";
import { semesterApi } from "@/api/admin/semester.api";
import { schoolYearApi } from "@/api/admin/school-year.api";
import { useEducatorClasses } from "@/hooks/educator/useEducatorClasses";
import { toArray } from "@/utils/classes.utils";
import { getDefaultSemesterId } from "@/utils/semester.utils";
import type { EducatorClass } from "@/types/educator/class.types";
import type { Semester } from "@/types/admin/semester.types";
import type { SchoolYear } from "@/types/admin/school-year.types";

export interface EducatorTermScope {
  isLoading: boolean;
  schoolYearOptions: SchoolYear[];
  schoolYearId: string | null;
  handleSchoolYearChange: (id: string) => void;
  semesters: Semester[];
  semesterId: string;
  selectedSemesterName: string | undefined;
  handleSemesterChange: (value: string | null) => void;
  /** Ids of this educator's classes inside the selected school year / semester. */
  scopedClassIds: Set<string>;
}

/**
 * Shared school year + semester selection for the educator portal pages
 * (Schedule, Grade Templates). Mirrors the My Classes defaults: the active
 * year plus any year the educator teaches in, and the current semester.
 */
export function useEducatorTermScope(): EducatorTermScope {
  const [schoolYearId, setSchoolYearId] = useState<string | null>(null);
  const [semesterId, setSemesterId] = useState<string>("");
  const userSelectedRef = useRef(false);

  const { data: classesRaw, isLoading: classesLoading } = useEducatorClasses();

  const { data: semestersRaw } = useAsyncQuery(
    queryKeys.admin.semesters.list(),
    () => semesterApi.getAll(),
  );

  const { data: schoolYearsRaw, isLoading: schoolYearsLoading } = useAsyncQuery(
    queryKeys.admin.schoolYears.list(),
    () => schoolYearApi.getAll(),
  );

  const allSchoolYears = useMemo(
    () => toArray<SchoolYear>(schoolYearsRaw),
    [schoolYearsRaw],
  );

  const rawClasses = useMemo(
    () => toArray<EducatorClass>(classesRaw),
    [classesRaw],
  );

  const allSemesters = useMemo(
    () => toArray<Semester>(semestersRaw),
    [semestersRaw],
  );

  const schoolYearOptions = useMemo<SchoolYear[]>(() => {
    if (classesLoading) return [];
    const taughtYearIds = new Set(rawClasses.map((c) => c.school_year_id));
    return allSchoolYears.filter(
      (sy) => sy.status === "active" || taughtYearIds.has(sy.id),
    );
  }, [allSchoolYears, rawClasses, classesLoading]);

  const handleSchoolYearChange = useCallback((id: string): void => {
    userSelectedRef.current = false;
    setSchoolYearId(id);
    setSemesterId("");
  }, []);

  const semesters = useMemo(() => {
    if (!schoolYearId) return [];
    return allSemesters.filter((s) => s.schoolYearId === schoolYearId);
  }, [allSemesters, schoolYearId]);

  useEffect(() => {
    if (userSelectedRef.current) return;
    if (semesters.length === 0) return;

    const stillValid = semesterId && semesters.some((s) => s.id === semesterId);
    if (stillValid) return;

    const defaultId = getDefaultSemesterId(semesters);
    if (defaultId) setSemesterId(defaultId);
  }, [semesters, semesterId]);

  const handleSemesterChange = useCallback((value: string | null): void => {
    userSelectedRef.current = true;
    setSemesterId(value ?? "");
  }, []);

  const scopedClassIds = useMemo(() => {
    const ids = new Set<string>();
    for (const cls of rawClasses) {
      if (schoolYearId && cls.school_year_id !== schoolYearId) continue;
      if (semesterId && cls.semester_id !== semesterId) continue;
      ids.add(cls.id);
    }
    return ids;
  }, [rawClasses, schoolYearId, semesterId]);

  const selectedSemesterName = semesters.find((s) => s.id === semesterId)?.name;

  return {
    isLoading: classesLoading || schoolYearsLoading,
    schoolYearOptions,
    schoolYearId,
    handleSchoolYearChange,
    semesters,
    semesterId,
    selectedSemesterName,
    handleSemesterChange,
    scopedClassIds,
  };
}