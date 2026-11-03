"use client";
import { useState, useMemo } from "react";

export interface ClassFilters {
  semesterId: string | undefined;
  educatorId: string | undefined;
  programId: string | undefined;
  courseId: string | undefined;
  strandId: string | undefined;
  levelId: string | undefined;
  sectionId: string | undefined;
  search: string | undefined;
  /**
   * Narrows the list to a single subject. Set from `?subjectId=` on the Classes
   * page — without it, arriving from a subject's "Linked Classes" section
   * showed every class in the school year instead of that subject's classes.
   * `undefined` means "no subject filter", which is the default everywhere else.
   */
  subjectId: string | undefined;
}

export function useClassFilters(initialSubjectId?: string) {
  const [filterProgramId, setFilterProgramIdRaw] = useState<string>("all");
  const [filterCourseId, setFilterCourseIdRaw] = useState<string>("all");
  const [filterStrandId, setFilterStrandIdRaw] = useState<string>("all");
  const [filterLevelId, setFilterLevelIdRaw] = useState<string>("all");
  const [filterSectionId, setFilterSectionId] = useState<string>("all");
  const [filterSemesterId, setFilterSemesterId] = useState<string>("all");
  const [filterEducatorId, setFilterEducatorId] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  // Locked to the arrival param: the Classes page has no subject filter control,
  // so letting it drift would silently un-filter a list the user came to see.
  const [subjectId] = useState<string | undefined>(initialSubjectId);

  function resetBelowProgram() {
    setFilterCourseIdRaw("all");
    setFilterStrandIdRaw("all");
    setFilterLevelIdRaw("all");
    setFilterSectionId("all");
  }

  // Changing department invalidates everything scoped under it, so every
  // dependent Select falls back to "all" and never points at a stale id.
  function setFilterProgramId(value: string) {
    setFilterProgramIdRaw(value);
    resetBelowProgram();
    setFilterSemesterId("all");
  }

  function setFilterCourseId(value: string) {
    setFilterCourseIdRaw(value);
    setFilterLevelIdRaw("all");
    setFilterSectionId("all");
  }

  function setFilterStrandId(value: string) {
    setFilterStrandIdRaw(value);
    setFilterLevelIdRaw("all");
    setFilterSectionId("all");
  }

  function setFilterLevelId(value: string) {
    setFilterLevelIdRaw(value);
    setFilterSectionId("all");
  }

  // Used when the user picks a semester from the "All Departments" grouped
  // list (e.g. "1st - College"). Department and semester must be set together:
  // setting only the semesterId would match every department's semester.
  function setDepartmentAndSemester(programId: string, semesterId: string) {
    setFilterProgramIdRaw(programId);
    resetBelowProgram();
    setFilterSemesterId(semesterId);
  }

  const query: ClassFilters = useMemo(
    () => ({
      semesterId: filterSemesterId !== "all" ? filterSemesterId : undefined,
      educatorId: filterEducatorId !== "all" ? filterEducatorId : undefined,
      programId: filterProgramId !== "all" ? filterProgramId : undefined,
      courseId: filterCourseId !== "all" ? filterCourseId : undefined,
      strandId: filterStrandId !== "all" ? filterStrandId : undefined,
      levelId: filterLevelId !== "all" ? filterLevelId : undefined,
      sectionId: filterSectionId !== "all" ? filterSectionId : undefined,
      search: search.trim() ? search.trim() : undefined,
      subjectId,
    }),
    [
      filterSemesterId,
      filterEducatorId,
      filterProgramId,
      filterCourseId,
      filterStrandId,
      filterLevelId,
      filterSectionId,
      search,
      subjectId,
    ]
  );

  function resetSemester() {
    setFilterSemesterId("all");
  }

  return {
    filterProgramId,
    filterCourseId,
    filterStrandId,
    filterLevelId,
    filterSectionId,
    filterSemesterId,
    filterEducatorId,
    search,
    setFilterProgramId,
    setFilterCourseId,
    setFilterStrandId,
    setFilterLevelId,
    setFilterSectionId,
    setFilterSemesterId,
    setFilterEducatorId,
    setDepartmentAndSemester,
    setSearch,
    resetSemester,
    query,
  };
}